#!/usr/bin/env python3
"""
Inspecciona cómo thesmartinvestortool.com maneja el % Change YoY en:
1. income_statement JSON (ej. income_statement_growth)
2. balance_sheet JSON
3. cash_flow JSON
4. estimates (% growth)
5. HTML tables
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import settings, get_effective_cookies
import requests
from bs4 import BeautifulSoup

cookies = get_effective_cookies()
session = requests.Session()
session.headers.update({
    "User-Agent": settings.USER_AGENT,
    "Referer": f"{settings.BASE_URL}/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
})
session.cookies.update(cookies)

SYMBOL = "MSFT"

# 1. Income Statement JSON
url_is = f"{settings.BASE_URL}/income_statement?symbol={SYMBOL}&limit=10&period=annual"
resp_is = session.get(url_is, timeout=15)
data_is = resp_is.json()
print("=== INCOME STATEMENT JSON ===")
print("Keys:", list(data_is.keys()))
if "income_statement_growth" in data_is:
    growth = data_is["income_statement_growth"]
    print("income_statement_growth type:", type(growth).__name__)
    if isinstance(growth, list):
        print(f"growth list length: {len(growth)}")
        for item in growth[:5]:
            print("  growth item:", item)
    elif isinstance(growth, dict):
        for k, v in list(growth.items())[:5]:
            print(f"  growth[{k}]:", v)

# Check all data rows in income_statement
print("\nPrimeras 8 filas de data_is['data']:")
for row in data_is.get("data", [])[:8]:
    print("  ", row[0], "->", row[1:5])

# 2. Balance Sheet JSON
url_bs = f"{settings.BASE_URL}/balance_sheet?symbol={SYMBOL}&limit=10&period=annual"
resp_bs = session.get(url_bs, timeout=15)
data_bs = resp_bs.json()
print("\n=== BALANCE SHEET JSON ===")
print("Keys:", list(data_bs.keys()))
for k in data_bs.keys():
    if "growth" in k.lower() or "change" in k.lower():
        print(f"Found growth key [{k}]:", data_bs[k][:3] if isinstance(data_bs[k], list) else data_bs[k])
for row in data_bs.get("data", [])[:6]:
    print("  ", row[0], "->", row[1:5])

# 3. Cash Flow JSON
url_cf = f"{settings.BASE_URL}/cash_flow?symbol={SYMBOL}&limit=10&period=annual"
resp_cf = session.get(url_cf, timeout=15)
data_cf = resp_cf.json()
print("\n=== CASH FLOW JSON ===")
print("Keys:", list(data_cf.keys()))
for k in data_cf.keys():
    if "growth" in k.lower() or "change" in k.lower():
        print(f"Found growth key [{k}]:", data_cf[k][:3] if isinstance(data_cf[k], list) else data_cf[k])
for row in data_cf.get("data", [])[:6]:
    print("  ", row[0], "->", row[1:5])

# 4. Check HTML rendering of tables on the web page to see exact labels and format
resp_metrics = session.get(f"{settings.BASE_URL}/metrics?symbol={SYMBOL}", timeout=15)
soup = BeautifulSoup(resp_metrics.text, "html.parser")
# Search for '%' or 'YoY' or 'Growth' in table rows
print("\n=== HTML TABLES SEARCH FOR 'YoY' OR 'Growth' OR '%' ===")
for t in soup.find_all("table"):
    for r in t.find_all("tr"):
        row_text = r.get_text(" | ", strip=True)
        if any(w in row_text.lower() for w in ["yoy", "growth", "% change", "change %"]):
            print("  HTML Row:", row_text[:100])
