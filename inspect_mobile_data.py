#!/usr/bin/env python3
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

resp = session.get(f"{settings.BASE_URL}/metrics?symbol=MSFT", timeout=15)
soup = BeautifulSoup(resp.text, "html.parser")

print("=== BUSCANDO INDICADORES TÉCNICOS (RSI, MA200, MA50, MA20) ===")
for t in soup.find_all("table"):
    txt = t.get_text()
    if any(k in txt.upper() for k in ["RSI", "SMA", "EMA", "MA 200", "MA 50", "MA 20", "52 WEEK"]):
        print("Encontrada tabla técnica:")
        for r in t.find_all("tr"):
            print(" ", [c.get_text(strip=True) for c in r.find_all(["td", "th"])])

print("\n=== BUSCANDO VARIABLES JS DE PRECIO O CHARTS ===")
matches = re.findall(r'var\s+([a-zA-Z0-9_]+)\s*=\s*([^\n;]+);', resp.text)
for var_name, var_val in matches:
    if any(k in var_name.lower() for k in ["price", "chart", "historical", "stock_history", "candle", "technical", "ratios_history", "fair_value"]):
        print(f"  [{var_name}] = {var_val[:140]}")
