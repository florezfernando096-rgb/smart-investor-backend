#!/usr/bin/env python3
"""
Extrae el código JS completo del renderizado de la tabla de Estimates en thesmartinvestortool.com
para ver con exactitud milimétrica qué filas, columnas y valores muestra la página oficial.
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
lines = resp.text.split("\n")

print(f"Total líneas HTML: {len(lines)}")

# Buscar el bloque exacto de estimates_table
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if "$('#estimates_table')" in line or "$(\"#estimates_table\")" in line:
        if start_idx is None:
            start_idx = max(0, i - 10)
    if "estimates_dividends" in line and "append" in line:
        end_idx = min(len(lines), i + 30)

print(f"Rango de código JS Estimates: L{start_idx} a L{end_idx}")
if start_idx and end_idx:
    with open("estimates_table_rendered_code.js", "w", encoding="utf-8") as f:
        f.write("\n".join(lines[start_idx:end_idx]))
    print("Guardado en estimates_table_rendered_code.js")

    # Muestra partes clave
    for j in range(start_idx, min(start_idx + 80, len(lines))):
        print(f"L{j}: {lines[j]}")
