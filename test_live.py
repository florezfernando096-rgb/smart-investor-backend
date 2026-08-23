#!/usr/bin/env python3
"""Test rápido del scraper con datos reales del sitio."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scraper import SmartInvestorScraper

scraper = SmartInvestorScraper()
print("Cookies cargadas:", list(scraper.cookies.keys()))

print("\n--- Probando fetch_metrics('MSFT') ---")
result = scraper.fetch_metrics("MSFT", "annual")

print(f"Compañía: {result['company_name']}")
print(f"Precio:   {result['price']}")
print(f"KPIs ({len(result['kpis'])}): {dict(list(result['kpis'].items())[:5])}")

for section in ["income_statement", "balance_sheet", "cash_flow", "ratios"]:
    tbl = result[section]
    print(f"\n{section.upper()}")
    print(f"  Título:   {tbl['title']}")
    print(f"  Períodos: {tbl['periods']}")
    print(f"  Filas:    {len(tbl['rows'])}")
    if tbl['rows']:
        r = tbl['rows'][0]
        print(f"  Fila[0]:  {r['metric']} -> {r['values'][:4]}")
        r2 = tbl['rows'][1] if len(tbl['rows']) > 1 else None
        if r2:
            print(f"  Fila[1]:  {r2['metric']} -> {r2['values'][:4]}")
