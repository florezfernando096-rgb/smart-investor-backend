#!/usr/bin/env python3
"""
Inspecciona cómo thesmartinvestortool.com estructura las filas en el HTML para Income Statement, Balance Sheet y Cash Flow
"""
import sys, os, re
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

resp = session.get(f"{settings.BASE_URL}/metrics?symbol=MSFT", timeout=15)
soup = BeautifulSoup(resp.text, "html.parser")

# Check all tables with multiple rows
for t in soup.find_all("table"):
    rows = t.find_all("tr")
    if len(rows) > 4:
        prev_h = t.find_previous(["h1", "h2", "h3", "h4", "h5"])
        title = prev_h.get_text(strip=True) if prev_h else "Tabla"
        print(f"\n--- {title} ({len(rows)} filas) ---")
        for r in rows[:8]:
            cells = [c.get_text(" ", strip=True) for c in r.find_all(["td", "th"])]
            print("  ", cells[:6])
