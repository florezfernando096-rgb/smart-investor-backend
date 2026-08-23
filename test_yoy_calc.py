#!/usr/bin/env python3
"""
Prueba de cálculo e inserción de '% Change YoY' en Income Statement, Balance Sheet, Cash Flow y Estimates.
"""
import sys, os, json
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

# Probar con income_statement
url_is = f"{settings.BASE_URL}/income_statement?symbol=MSFT&limit=10&period=annual"
resp_is = session.get(url_is, timeout=15)
data_is = resp_is.json()

raw_rows = data_is.get("data", [])
years = [y.get("title") for y in data_is.get("years", []) if y.get("title") and y.get("title") != "Total"]

print(f"Períodos: {years}")
print(f"Total filas raw: {len(raw_rows)}")

for r in raw_rows[:10]:
    metric = r[0]
    vals = r[1:len(years)+1]
    print(f"  {metric:30s} -> {vals[:5]}")
