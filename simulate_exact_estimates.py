#!/usr/bin/env python3
"""
Simula exactamente la lógica JS de thesmartinvestortool.com para la tabla de Estimates.
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

estimates = extract_js_var("estimates", resp.text)
full_income_statement = extract_js_var("full_income_statement", resp.text)
income_statement_growth = extract_js_var("income_statement_growth", resp.text)
financial_growth = extract_js_var("financial_growth", resp.text)
company_profile = extract_js_var("company_profile", resp.text)

first_est_year = int(estimates.get('first_estimate_year', 2027))
start_year = first_est_year - 5

headers = []
for i in range(10):
    if i > 4:
        headers.append(f"{start_year + i}E")
    else:
        headers.append(f"{start_year + i}")
headers.append("Growth")

print("Headers que genera thesmartinvestortool.com:")
print(headers)

# Veamos revenues
estimates_rev = estimates.get('estimates_rev', [])
estimates_rev_array = []
for i in range(4, -1, -1):
    if i < len(full_income_statement):
        estimates_rev_array.append(round(full_income_statement[i]['revenue'] / 1_000_000))
    else:
        estimates_rev_array.append(0)

for val in estimates_rev:
    estimates_rev_array.append(round(val))

estimates_rev_percentage_array = []
for i in range(4, -1, -1):
    if i < len(income_statement_growth):
        estimates_rev_percentage_array.append(income_statement_growth[i].get('growthRevenue', 0))
    else:
        estimates_rev_percentage_array.append(0)

rev_next_5_years_percentage = 0
for i in range(5, len(estimates_rev_array)):
    prev = estimates_rev_array[i - 1]
    curr = estimates_rev_array[i]
    if prev != 0:
        pct = (curr - prev) / prev
        estimates_rev_percentage_array.append(pct)
        rev_next_5_years_percentage += pct
    else:
        estimates_rev_percentage_array.append('-')

avg_rev_growth = (rev_next_5_years_percentage / len(estimates_rev)) * 100

print("\n--- REVENUES ---")
print("Valores Nominales (10 años):", [f"${v:,.0f}M" for v in estimates_rev_array] + [""])
print("% Change YoY (10 años + Growth):", [f"{p*100:+.2f}%" if isinstance(p, (int, float)) else p for p in estimates_rev_percentage_array] + [f"{avg_rev_growth:+.2f}%"])
