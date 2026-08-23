#!/usr/bin/env python3
"""
Prueba de extracción directa de valores de Growth de la API para varios tickers.
"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import settings, get_effective_cookies
import requests

cookies = get_effective_cookies()
session = requests.Session()
session.headers.update({
    "User-Agent": settings.USER_AGENT,
    "Referer": f"{settings.BASE_URL}/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
})
session.cookies.update(cookies)

for sym in ["MSFT", "NVDA", "AAPL"]:
    resp = session.get(f"{settings.BASE_URL}/metrics?symbol={sym}", timeout=15)
    
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

    inc_growth = extract_js_var("income_statement_growth", resp.text)
    fin_growth = extract_js_var("financial_growth", resp.text)
    estimates = extract_js_var("estimates", resp.text)

    print(f"\n=== TICKER {sym} ===")
    if inc_growth:
        print("  Revenue Growth (API):", f"{inc_growth[0].get('growthRevenue', 0)*100:.2f}%")
        print("  EBITDA Growth (API):", f"{inc_growth[0].get('growthEBITDA', 0)*100:.2f}%")
        print("  Net Income Growth (API):", f"{inc_growth[0].get('growthNetIncome', 0)*100:.2f}%")
        print("  EPS Growth (API):", f"{inc_growth[0].get('growthEPS', 0)*100:.2f}%")
    if fin_growth:
        print("  FCF Growth (API):", f"{fin_growth[0].get('freeCashFlowGrowth', 0)*100:.2f}%")
        print("  Dividend Growth (API):", f"{fin_growth[0].get('dividendsperShareGrowth', 0)*100:.2f}%")
    if estimates:
        print("  Analyst EPS Growth (API):", estimates.get("eps_growth"))
