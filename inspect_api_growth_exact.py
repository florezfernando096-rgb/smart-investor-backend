#!/usr/bin/env python3
"""
Inspecciona todas las variables y estructuras relacionadas con Growth directamente
en la respuesta de thesmartinvestortool.com para MSFT.
"""
import sys, os, re, json
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
resp = session.get(f"{settings.BASE_URL}/metrics?symbol={SYMBOL}", timeout=15)

# Buscar todas las variables 'var ... = ...'
matches = re.findall(r'var\s+([a-zA-Z0-9_]+)\s*=\s*([^\n;]+);', resp.text)
print(f"Total variables 'var ...' encontradas: {len(matches)}")
for var_name, var_val in matches:
    if any(k in var_name.lower() for k in ["growth", "estimate", "ratio", "metric", "fair_value"]):
        print(f"  [{var_name}] = {var_val[:120]}")

# Buscar tags con IDs relacionados con growth
soup = BeautifulSoup(resp.text, "html.parser")
growth_elements = soup.find_all(id=re.compile(r'growth', re.I))
print(f"\nElementos HTML con ID conteniendo 'growth': {len(growth_elements)}")
for el in growth_elements:
    print(f"  ID: {el.get('id')} -> Texto: '{el.get_text(strip=True)}'")

# Revisar si hay un endpoint específico para financial_growth o analistas
for cand in [
    f"{settings.BASE_URL}/financial_growth?symbol={SYMBOL}",
    f"{settings.BASE_URL}/growth?symbol={SYMBOL}",
    f"{settings.BASE_URL}/api/growth?symbol={SYMBOL}",
    f"{settings.BASE_URL}/stock/growth?symbol={SYMBOL}",
]:
    r = session.get(cand, timeout=5)
    print(f"[{r.status_code}] {cand} -> Length: {len(r.text)}, Content-Type: {r.headers.get('Content-Type')[:30]}")
