#!/usr/bin/env python3
"""
Inspecciona detalladamente el HTML y JS del tab Estimates en thesmartinvestortool.com
para encontrar la columna 'Growth' y cómo se calcula/muestra.
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

print("=== BUSCANDO TABLA DE ESTIMATES EN HTML ===")
for t in soup.find_all("table"):
    th_cells = [th.get_text(strip=True) for th in t.find_all("th")]
    if any("estimate" in str(th).lower() or "growth" in str(th).lower() or "2027" in str(th) or "2026" in str(th) for th in th_cells):
        print(f"Encontrada tabla con headers: {th_cells}")

# Buscar en JS donde se construyen los th o td para estimates
print("\n=== BUSCANDO EN SCRIPTS JS PARA ESTIMATES TABLE ===")
scripts = resp.text.split("\n")
for i, line in enumerate(scripts):
    if any(k in line.lower() for k in ["estimates_table", "estimate_table", "estimates_rev_percentage_array", "rev_next_5_years_percentage", "growth", "next_5_years"]):
        if any(h in line.lower() for h in ["append", "<th>", "<td>", "growth", "percentage", "average"]):
            print(f"L{i}: {line.strip()[:140]}")
