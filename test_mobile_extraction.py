#!/usr/bin/env python3
"""
Prueba de extracción completa de datos para el Dashboard Móvil.
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

resp = session.get(f"{settings.BASE_URL}/metrics?symbol=MSFT", timeout=15)

def extract_js_var(name, text):
    match = re.search(rf'var\s+{re.escape(name)}\s*=\s*([^\n;]+);', text)
    if match:
        raw = match.group(1).strip()
        cleaned = re.sub(r"Decimal\(['\"]?([-\d\.]+)['\"]?\)", r"\1", raw)
        try:
            return eval(cleaned, {"null": None, "true": True, "false": False, "nan": None, "Decimal": float})
        except Exception:
            return None
    return None

price_raw = extract_js_var("price", resp.text) or []
profile = extract_js_var("company_profile", resp.text) or [{}]
ratios_hist = extract_js_var("ratios_history", resp.text) or []
fv_data = extract_js_var("fair_value_data", resp.text) or {}

print(f"Price data points: {len(price_raw)}")
if price_raw:
    print("  Primer punto:", price_raw[0])
    print("  Último punto:", price_raw[-1])

print(f"\nCompany profile keys: {list(profile[0].keys()) if profile else []}")
if profile:
    p = profile[0]
    print(f"  Price: {p.get('price')}, Changes: {p.get('changes')}, Range: {p.get('range')}, MktCap: {p.get('mktCap')}, Beta: {p.get('beta')}")

print(f"\nRatios history count: {len(ratios_hist)}")
if ratios_hist:
    print("  Último año ratios:", ratios_hist[0])

# Parsear indicadores técnicos desde las tablas HTML
soup = BeautifulSoup(resp.text, "html.parser")
technicals = {}
for t in soup.find_all("table"):
    for r in t.find_all("tr"):
        cells = [c.get_text(strip=True) for c in r.find_all(["td", "th"])]
        if len(cells) >= 2:
            if "RSI" in cells[0].upper():
                technicals["RSI"] = cells[1]
            if "MA200" in cells[0].upper() or (len(cells) >= 4 and "MA200" in cells[2].upper()):
                technicals["MA200"] = cells[3] if len(cells) >= 4 else cells[1]
            if "MA50" in cells[0].upper() or (len(cells) >= 4 and "MA50" in cells[2].upper()):
                technicals["MA50"] = cells[3] if len(cells) >= 4 else cells[1]
            if "MA20" in cells[0].upper() or (len(cells) >= 4 and "MA20" in cells[2].upper()):
                technicals["MA20"] = cells[3] if len(cells) >= 4 else cells[1]

print("\nTechnicals extraídos:", technicals)
