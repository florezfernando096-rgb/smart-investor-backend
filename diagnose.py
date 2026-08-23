#!/usr/bin/env python3
"""
Script de diagnóstico: prueba los endpoints del sitio con las cookies del .env
y muestra qué estructura de datos devuelve cada uno.
"""
import sys
import os
import json
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")

from config import settings, get_effective_cookies

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Instala dependencias: pip install requests beautifulsoup4")
    sys.exit(1)

SYMBOL = "MSFT"
cookies = get_effective_cookies()

print(f"\n{'='*60}")
print("DIAGNÓSTICO DE ENDPOINTS — TheSmartInvestorTool")
print(f"{'='*60}")
print(f"Cookies configuradas: {list(cookies.keys())}")
print()

session = requests.Session()
session.headers.update({
    "User-Agent": settings.USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://thesmartinvestortool.com/",
})
session.cookies.update(cookies)

ENDPOINTS = {
    "metrics":          f"{settings.BASE_URL}/metrics?symbol={SYMBOL}",
    "income_statement": f"{settings.BASE_URL}/income_statement?symbol={SYMBOL}&limit=10&period=annual",
    "balance_sheet":    f"{settings.BASE_URL}/balance_sheet?symbol={SYMBOL}&limit=10&period=annual",
    "cash_flow":        f"{settings.BASE_URL}/cash_flow?symbol={SYMBOL}&limit=10&period=annual",
}

for name, url in ENDPOINTS.items():
    print(f"{'─'*60}")
    print(f"[{name.upper()}]  {url}")
    try:
        resp = session.get(url, timeout=15, allow_redirects=True)
        print(f"  Status: {resp.status_code}  |  Final URL: {resp.url}")
        print(f"  Content-Type: {resp.headers.get('Content-Type', 'N/A')}")
        print(f"  Body length: {len(resp.text)} chars")

        # Check auth redirect
        if any(p in resp.url.lower() for p in ["/login", "/signin", "/auth", "/register"]):
            print("  ⚠️  REDIRECCIÓN A LOGIN — cookie inválida o expirada")
            continue

        text_lower = resp.text.lower()
        if "forgot password" in text_lower and "create an account" in text_lower:
            print("  ⚠️  RESPUESTA CONTIENE PÁGINA DE LOGIN (200 falso)")
            continue

        soup = BeautifulSoup(resp.text, "html.parser")

        # Check __NEXT_DATA__
        next_script = soup.find("script", id="__NEXT_DATA__")
        if next_script and next_script.string:
            try:
                nd = json.loads(next_script.string)
                pp = nd.get("props", {}).get("pageProps", {})
                print(f"  ✅ __NEXT_DATA__ encontrado — pageProps keys: {list(pp.keys())[:10]}")
                # Buscar datos de tabla
                for k, v in pp.items():
                    if isinstance(v, dict):
                        print(f"     [{k}] -> dict keys: {list(v.keys())[:8]}")
                    elif isinstance(v, list) and v:
                        print(f"     [{k}] -> list de {len(v)} items, primer item: {type(v[0]).__name__}")
                    elif isinstance(v, (str, int, float, bool)) and v:
                        print(f"     [{k}] = {str(v)[:60]}")
            except Exception as e:
                print(f"  ⚠️  Error parsing __NEXT_DATA__: {e}")
        else:
            print("  ℹ️  Sin __NEXT_DATA__")

        # Check HTML tables
        tables = soup.find_all("table")
        print(f"  Tablas HTML <table> encontradas: {len(tables)}")
        for i, t in enumerate(tables[:3]):
            rows = t.find_all("tr")
            print(f"    Tabla {i+1}: {len(rows)} filas")
            if rows:
                first_row = [c.get_text(strip=True) for c in rows[0].find_all(["th", "td"])]
                print(f"      Primera fila: {first_row[:6]}")

        # Check page title / headings
        h1 = soup.find("h1")
        if h1:
            print(f"  h1: {h1.get_text(strip=True)[:80]}")

        # Check for JSON API responses
        if "application/json" in resp.headers.get("Content-Type", ""):
            try:
                data = resp.json()
                print(f"  ✅ Respuesta JSON — keys: {list(data.keys())[:10]}")
            except Exception:
                pass

        # Buscar referencias a API endpoints en el JavaScript
        api_matches = re.findall(r'["\'](/api/[^"\']{3,60})["\']', resp.text)
        if api_matches:
            unique_apis = list(set(api_matches))[:8]
            print(f"  📡 API endpoints JS detectados: {unique_apis}")

    except Exception as e:
        print(f"  ❌ ERROR: {e}")

print(f"\n{'='*60}")
print("FIN DEL DIAGNÓSTICO")
print(f"{'='*60}\n")
