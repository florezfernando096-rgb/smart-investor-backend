#!/usr/bin/env python3
"""Inspecciona la estructura JSON de cada endpoint financiero."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")
from config import settings, get_effective_cookies
import requests
from bs4 import BeautifulSoup

SYMBOL = "MSFT"
cookies = get_effective_cookies()
session = requests.Session()
session.headers.update({"User-Agent": settings.USER_AGENT, "Referer": settings.BASE_URL + "/"})
session.cookies.update(cookies)

# ── JSON endpoints ─────────────────────────────────────────
for name in ["income_statement", "balance_sheet", "cash_flow"]:
    url = f"{settings.BASE_URL}/{name}?symbol={SYMBOL}&limit=10&period=annual"
    resp = session.get(url, timeout=15)
    data = resp.json()
    print(f"\n{'='*60}")
    print(f"  {name.upper()}")
    print(f"  keys: {list(data.keys())}")
    years = data.get("years", [])
    print(f"  years ({len(years)}): {years}")
    section_data = data.get("data", {})
    print(f"  data type: {type(section_data).__name__}")
    if isinstance(section_data, dict):
        for k, v in list(section_data.items())[:8]:
            print(f"    [{k}] = {str(v)[:100]}")
    elif isinstance(section_data, list) and section_data:
        print(f"  data[0] sample: {str(section_data[0])[:200]}")

# ── HTML /metrics — estructura de tablas ──────────────────
print(f"\n{'='*60}")
print("  METRICS PAGE — Análisis de las 33 tablas HTML")
resp = session.get(f"{settings.BASE_URL}/metrics?symbol={SYMBOL}", timeout=15)
soup = BeautifulSoup(resp.text, "html.parser")
tables = soup.find_all("table")
for i, t in enumerate(tables[:15]):
    rows = t.find_all("tr")
    prev_heading = t.find_previous(["h2","h3","h4","h5","caption"])
    heading = prev_heading.get_text(strip=True)[:50] if prev_heading else "sin título"
    print(f"  Tabla {i+1:2d} [{heading}]: {len(rows)} filas")
    for r in rows[:3]:
        cells = [c.get_text(strip=True)[:20] for c in r.find_all(["th","td"])]
        if cells:
            print(f"           {cells}")
