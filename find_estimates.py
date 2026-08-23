#!/usr/bin/env python3
"""
Explora posibles endpoints de Estimates en thesmartinvestortool.com con las cookies activas.
"""
import sys, os, json, re
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

CANDIDATES = [
    f"{settings.BASE_URL}/estimates?symbol={SYMBOL}",
    f"{settings.BASE_URL}/estimates?symbol={SYMBOL}&limit=10&period=annual",
    f"{settings.BASE_URL}/analyst_estimates?symbol={SYMBOL}",
    f"{settings.BASE_URL}/analyst_estimates?symbol={SYMBOL}&limit=10&period=annual",
    f"{settings.BASE_URL}/earnings_estimates?symbol={SYMBOL}",
    f"{settings.BASE_URL}/financial_estimates?symbol={SYMBOL}",
    f"{settings.BASE_URL}/revenue_estimates?symbol={SYMBOL}",
    f"{settings.BASE_URL}/eps_estimates?symbol={SYMBOL}",
    f"{settings.BASE_URL}/forecast?symbol={SYMBOL}",
    f"{settings.BASE_URL}/forecasts?symbol={SYMBOL}",
    f"{settings.BASE_URL}/metrics?symbol={SYMBOL}",  # to search for tabs/links in HTML
]

print(f"Probando {len(CANDIDATES)} endpoints candidatos...\n")

for url in CANDIDATES:
    try:
        resp = session.get(url, timeout=10, allow_redirects=True)
        ct = resp.headers.get("Content-Type", "")
        print(f"[{resp.status_code}] {url} -> Content-Type: {ct[:30]}, Length: {len(resp.text)}")
        if "application/json" in ct and resp.status_code == 200:
            try:
                js = resp.json()
                print(f"   ✅ JSON keys: {list(js.keys()) if isinstance(js, dict) else f'list of {len(js)}'}")
                if isinstance(js, dict):
                    if "years" in js:
                        print(f"   years: {js.get('years')}")
                    if "data" in js:
                        d = js.get("data")
                        print(f"   data sample: {d[:2] if isinstance(d, list) else list(d.keys())[:5]}")
            except Exception as e:
                print(f"   Error parsing json: {e}")
        elif resp.status_code == 200 and "metrics" in url:
            # Look for estimates links or tabs in the HTML
            soup = BeautifulSoup(resp.text, "html.parser")
            links = soup.find_all("a", href=True)
            estimate_links = [a['href'] for a in links if 'estimate' in a['href'].lower() or 'forecast' in a['href'].lower()]
            print(f"   Enlaces a Estimates en la página: {set(estimate_links)}")
            buttons = soup.find_all(["button", "a"], string=re.compile(r'estimate', re.I))
            print(f"   Botones de Estimates: {[b.get_text(strip=True) for b in buttons]}")
    except Exception as e:
        print(f"   Error: {e}")
