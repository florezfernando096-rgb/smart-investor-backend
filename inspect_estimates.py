#!/usr/bin/env python3
"""
Inspecciona el contenido del tab Estimates en /metrics?symbol=MSFT
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

print("Buscando elementos con id o clase 'estimate'...")
est_elements = soup.find_all(id=re.compile(r'estimate', re.I))
print(f"Elementos con ID 'estimate': {[el.get('id') for el in est_elements]}")

# Inspeccionar cada contenedor de estimate
for el in est_elements:
    print(f"\n--- Contenedor ID: {el.get('id')} ---")
    tables = el.find_all("table")
    print(f"Tablas dentro del contenedor: {len(tables)}")
    for i, t in enumerate(tables):
        rows = t.find_all("tr")
        print(f"  Tabla {i+1} con {len(rows)} filas:")
        for r in rows[:6]:
            cells = [c.get_text(" ", strip=True) for c in r.find_all(["th", "td"])]
            print(f"    {cells}")

# Buscar llamadas fetch o ajax en scripts relacionados con estimates
scripts = soup.find_all("script")
for s in scripts:
    text = s.string or ""
    if "estimate" in text.lower():
        print("\n--- Script con referencias a estimates ---")
        lines = [line.strip() for line in text.split("\n") if "estimate" in line.lower() or "url:" in line.lower() or "fetch(" in line.lower()]
        for line in lines[:15]:
            print("  ", line[:120])
