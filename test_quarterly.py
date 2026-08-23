#!/usr/bin/env python3
"""
Prueba los endpoints trimestrales en thesmartinvestortool.com:
- period=quarter
- period=quarterly
- period=Q
"""
import sys, os, json
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

SYMBOL = "MSFT"

for param in ["quarter", "quarterly", "quarterly&limit=10", "quarter&limit=10", "quarter&limit=8"]:
    url = f"{settings.BASE_URL}/income_statement?symbol={SYMBOL}&limit=10&period={param}"
    try:
        resp = session.get(url, timeout=15)
        if resp.status_code == 200 and "application/json" in resp.headers.get("Content-Type", ""):
            data = resp.json()
            years = [y.get("title") for y in data.get("years", [])]
            rows = len(data.get("data", []))
            print(f"✅ [period={param}] Status 200 JSON:")
            print(f"   Períodos ({len(years)}): {years}")
            print(f"   Total filas: {rows}")
            if data.get("data"):
                print(f"   Fila 0: {data['data'][0][0]} -> {data['data'][0][1:5]}")
                print(f"   Fila 1: {data['data'][1][0]} -> {data['data'][1][1:5]}")
        else:
            print(f"❌ [period={param}] Status: {resp.status_code}, Content-Type: {resp.headers.get('Content-Type')[:30]}")
    except Exception as e:
        print(f"Error con period={param}: {e}")

# También probar balance_sheet y cash_flow con quarterly/quarter
for endpoint in ["balance_sheet", "cash_flow"]:
    for param in ["quarter", "quarterly"]:
        url = f"{settings.BASE_URL}/{endpoint}?symbol={SYMBOL}&limit=10&period={param}"
        resp = session.get(url, timeout=10)
        if resp.status_code == 200 and "application/json" in resp.headers.get("Content-Type", ""):
            data = resp.json()
            years = [y.get("title") for y in data.get("years", [])]
            print(f"✅ [{endpoint} period={param}] Períodos: {years[:6]}")
