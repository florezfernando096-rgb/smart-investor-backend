#!/usr/bin/env python3
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
for m in re.finditer(r'dcf_free_cash_flow\s*=', resp.text):
    start = max(0, m.start() - 100)
    end = min(len(resp.text), m.end() + 300)
    print("--- ENCONTRADO EN HTML ---")
    print(resp.text[start:end])
