#!/usr/bin/env python3
"""
Extrae la variable 'estimates' y la estructura completa de estimaciones del HTML de /metrics?symbol=MSFT
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

# Buscar `var estimates = ...` en el HTML
match = re.search(r'var\s+estimates\s*=\s*(\{.*?\});\s*(?:var|\n|\r)', resp.text, re.DOTALL)
if match:
    raw_estimates_str = match.group(1)
    print(f"Longitud de estimates string: {len(raw_estimates_str)}")
    # Limpiar Decimal('...') para parsear como JSON/Python
    cleaned = re.sub(r"Decimal\(['\"]?([-\d\.]+)['\"]?\)", r"\1", raw_estimates_str)
    # Convertir comillas simples a dobles o usar ast.literal_eval
    import ast
    try:
        # Reemplazar None/True/False/Decimal
        estimates_dict = eval(cleaned, {"Decimal": float, "null": None, "true": True, "false": False, "nan": None})
        print("✅ Objeto estimates parseado con éxito:")
        print("Keys:", list(estimates_dict.keys()))
        for k, v in estimates_dict.items():
            if isinstance(v, dict):
                print(f"  [{k}] (dict): {list(v.keys())}")
            elif isinstance(v, list):
                print(f"  [{k}] (list de {len(v)} items):")
                if v:
                    print(f"     primer item: {v[0]}")
            else:
                print(f"  [{k}] = {v}")
    except Exception as e:
        print(f"Error evaluando estimates: {e}")
        print("Primeros 500 caracteres:", raw_estimates_str[:500])
else:
    print("No se encontró 'var estimates = ...'")

# También buscar tablas dentro de #estimates-tab
soup = BeautifulSoup(resp.text, "html.parser")
est_tab = soup.find(id="estimates-tab") or soup.find(id="estimates")
if est_tab:
    print("\n--- HTML de #estimates-tab ---")
    print(est_tab.get_text(" ", strip=True)[:1000])
