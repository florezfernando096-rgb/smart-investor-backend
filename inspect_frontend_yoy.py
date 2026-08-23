#!/usr/bin/env python3
"""
Inspecciona el JavaScript de thesmartinvestortool.com para ver cómo renderiza las tablas
con los porcentajes YoY o Growth.
"""
import sys, os, re
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

# Buscar funciones JS que construyen tablas o calculan YoY / Growth
scripts = resp.text
matches = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{[^}]*(?:growth|percentage|yoy|change)[^}]*\}', scripts, re.I)
print("Funciones JS encontradas con growth/percentage/yoy:")
for m in matches[:10]:
    print("  Function:", m)

# Buscar snippets de código con 'Growth' o 'percentage' o 'YoY'
lines = scripts.split("\n")
print("\nLíneas JS relevantes:")
for i, line in enumerate(lines):
    if any(k in line.lower() for k in ["income_statement_growth", "growthrevenue", "percentage_tbody", "yoy", "growth_tbody"]):
        print(f"L{i}: {line.strip()[:140]}")
