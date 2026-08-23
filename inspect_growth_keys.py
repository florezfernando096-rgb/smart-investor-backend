#!/usr/bin/env python3
"""
Extrae las tasas de crecimiento directas de la API de thesmartinvestortool.com
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
        except Exception:
            return None
    return None

inc_growth = extract_js_var("income_statement_growth", resp.text)
fin_growth = extract_js_var("financial_growth", resp.text)
estimates = extract_js_var("estimates", resp.text)
fair_val = extract_js_var("fair_value_data", resp.text)

print("inc_growth keys:", inc_growth[0].keys() if inc_growth else [])
print("fin_growth keys:", fin_growth[0].keys() if fin_growth else [])
print("estimates:", json.dumps(estimates, indent=2, default=str))
