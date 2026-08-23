#!/usr/bin/env python3
"""
Muestra el contenido exacto de income_statement_growth, financial_growth, y cómo thesmartinvestortool
obtiene los valores de % Change YoY y Growth.
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

resp = session.get(f"{settings.BASE_URL}/metrics?symbol=MSFT", timeout=15)

def extract_js_var(name, text):
    match = re.search(rf'var\s+{re.escape(name)}\s*=\s*([^\n;]+);', text)
    if match:
        raw = match.group(1).strip()
        cleaned = re.sub(r"Decimal\(['\"]?([-\d\.]+)['\"]?\)", r"\1", raw)
        try:
            return eval(cleaned, {"null": None, "true": True, "false": False, "nan": None, "Decimal": float})
        except Exception as e:
            return f"Error eval: {e} | raw: {raw[:200]}"
    return None

inc_growth = extract_js_var("income_statement_growth", resp.text)
fin_growth = extract_js_var("financial_growth", resp.text)
estimates = extract_js_var("estimates", resp.text)
fair_value_data = extract_js_var("fair_value_data", resp.text)

print("=== INCOME_STATEMENT_GROWTH (primeros 3 items) ===")
if isinstance(inc_growth, list):
    for it in inc_growth[:3]:
        print(" ", it.get("calendarYear"), "->", {k: f"{v*100:.2f}%" if isinstance(v, (int, float)) and abs(v)<100 else v for k, v in list(it.items())[:8]})

print("\n=== FINANCIAL_GROWTH (primeros 3 items) ===")
if isinstance(fin_growth, list):
    for it in fin_growth[:3]:
        print(" ", it.get("calendarYear"), "->", {k: f"{v*100:.2f}%" if isinstance(v, (int, float)) and abs(v)<100 else v for k, v in list(it.items())[:8]})

print("\n=== ESTIMATES EPS_GROWTH & FAIR_VALUE_DATA ===")
if isinstance(estimates, dict):
    print("estimates['eps_growth']:", estimates.get("eps_growth"))
    print("estimates['perpetual_growth']:", estimates.get("perpetual_growth"))
if isinstance(fair_value_data, dict):
    print("fair_value_data keys:", list(fair_value_data.keys()))
    for k in ["g_80", "expected_growth_rate", "growth_rate", "growth"]:
        if k in fair_value_data:
            print(f"fair_value_data['{k}']:", fair_value_data.get(k))
