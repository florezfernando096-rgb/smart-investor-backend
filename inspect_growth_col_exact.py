#!/usr/bin/env python3
"""
Muestra el código exacto de thesmartinvestortool.com donde se calcula y añade la columna 'Growth' en Estimates.
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

for i in range(4345, 4400):
    if i < len(lines):
        print(f"L{i}: {lines[i]}")

print("\n--- Bloque de cálculo de la columna Growth ---")
for i in range(4820, 4890):
    if i < len(lines):
        print(f"L{i}: {lines[i]}")
