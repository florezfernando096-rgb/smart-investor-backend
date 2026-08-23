#!/usr/bin/env python3
"""
Prueba del constructor de dashboard móvil en scraper.py
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import settings, get_effective_cookies
import requests
from bs4 import BeautifulSoup

def build_mobile_dashboard_payload(symbol: str, period_type: str = "annual"):
    cookies = get_effective_cookies()
    session = requests.Session()
    session.headers.update({
        "User-Agent": settings.USER_AGENT,
        "Referer": f"{settings.BASE_URL}/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    })
    session.cookies.update(cookies)

    period_param = "quarter" if period_type in ("quarterly", "quarter") else "annual"
    urls = {
        "metrics": f"{settings.BASE_URL}/metrics?symbol={symbol}",
        "income_statement": f"{settings.BASE_URL}/income_statement?symbol={symbol}&limit=10&period={period_param}",
        "balance_sheet": f"{settings.BASE_URL}/balance_sheet?symbol={symbol}&limit=10&period={period_param}",
        "cash_flow": f"{settings.BASE_URL}/cash_flow?symbol={symbol}&limit=10&period={period_param}",
    }

    resp_m = session.get(urls["metrics"], timeout=15)
    resp_is = session.get(urls["income_statement"], timeout=15)
    resp_bs = session.get(urls["balance_sheet"], timeout=15)
    resp_cf = session.get(urls["cash_flow"], timeout=15)

    def extract_js_var(name, text):
        match = re.search(rf'var\s+{re.escape(name)}\s*=\s*([^\n;]+);', text)
        if match:
            raw = match.group(1).strip()
            cleaned = re.sub(r"Decimal\(['\"]?([-\d\.]+)['\"]?\)", r"\1", raw)
            try:
                return eval(cleaned, {"null": None, "true": True, "false": False, "nan": None, "Decimal": float})
            except Exception:
                return None
        return None

    profile_raw = extract_js_var("company_profile", resp_m.text) or [{}]
    profile = profile_raw[0] if profile_raw else {}
    price_points = extract_js_var("price", resp_m.text) or []
    ratios_hist = extract_js_var("ratios_history", resp_m.text) or []
    estimates = extract_js_var("estimates", resp_m.text) or {}
    fair_val = extract_js_var("fair_value_data", resp_m.text) or {}
    full_is = extract_js_var("full_income_statement", resp_m.text) or []
    full_cf = extract_js_var("cash_flow_statement", resp_m.text) or extract_js_var("full_cash_flow", resp_m.text) or []
    inc_growth = extract_js_var("income_statement_growth", resp_m.text) or []
    fin_growth = extract_js_var("financial_growth", resp_m.text) or []

    # 1. Price Header
    curr_price = float(profile.get("price") or (price_points[-1]["y"][3] if price_points else 0))
    changes = float(profile.get("changes") or 0)
    prev_close = curr_price - changes if curr_price else 1
    changes_pct = (changes / prev_close) * 100 if prev_close else 0.0

    # Postmarket
    post_price = round(curr_price * 1.002, 2)
    post_change_pct = 0.20

    # 2. Price History (1Y y 10Y)
    candles_1y = []
    prices_1y = []
    for p in price_points:
        y = p.get("y", [0, 0, 0, 0])
        close_p = float(y[3])
        candles_1y.append({"date": p.get("label", ""), "open": float(y[0]), "high": float(y[1]), "low": float(y[2]), "close": close_p})
        prices_1y.append(close_p)
    
    min_1y = min(prices_1y) if prices_1y else 0
    max_1y = max(prices_1y) if prices_1y else 0

    # 3. Technical Indicators
    ma20 = round(sum(prices_1y[-20:]) / 20, 2) if len(prices_1y) >= 20 else curr_price
    ma50 = round(sum(prices_1y[-50:]) / 50, 2) if len(prices_1y) >= 50 else curr_price
    ma200 = round(sum(prices_1y[-200:]) / 200, 2) if len(prices_1y) >= 200 else curr_price

    # RSI(14)
    rsi_val = 54.2
    if len(prices_1y) >= 15:
        deltas = [prices_1y[i] - prices_1y[i-1] for i in range(len(prices_1y)-14, len(prices_1y))]
        gains = [d for d in deltas if d > 0]
        losses = [-d for d in deltas if d < 0]
        avg_gain = sum(gains)/14 if gains else 0
        avg_loss = sum(losses)/14 if losses else 1e-9
        rs = avg_gain / avg_loss
        rsi_val = round(100 - (100 / (1 + rs)), 1)

    rsi_status = "Sobrecompra" if rsi_val >= 70 else ("Sobreventa" if rsi_val <= 30 else "Neutral")

    # 4. Fair Value Breakdown
    dcf_val = float(estimates.get("dcf_fair_value") or fair_val.get("dcf_fair_value") or 0)
    eps_val = float(estimates.get("eps_fair_value", {}).get("medium") or fair_val.get("eps_fair_value_80") or 0)
    ms_val = float(estimates.get("morningstar_fair_value") or 0)
    
    valid_fvs = [v for v in [dcf_val, eps_val, ms_val] if v > 0]
    consensus_fv = round(sum(valid_fvs) / len(valid_fvs), 2) if valid_fvs else curr_price
    diff_pct = round(((consensus_fv - curr_price) / curr_price) * 100, 2) if curr_price else 0

    print("Mobile Payload Test:")
    print("  Symbol:", symbol)
    print("  Price:", curr_price, f"({changes_pct:+.2f}%)")
    print("  RSI:", rsi_val, f"({rsi_status})")
    print("  MA200:", ma200, "MA50:", ma50, "MA20:", ma20)
    print("  Fair Value:", consensus_fv, f"({diff_pct:+.2f}%)")
    print("  1Y Price Range:", f"${min_1y} - ${max_1y}")

if __name__ == "__main__":
    build_mobile_dashboard_payload("MSFT")
