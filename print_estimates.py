#!/usr/bin/env python3
"""
Muestra el contenido completo formateado de estimates
"""
import sys, os, re, json
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
match = re.search(r'var\s+estimates\s*=\s*(\{.*?\});\s*(?:var|\n|\r)', resp.text, re.DOTALL)
if match:
    cleaned = re.sub(r"Decimal\(['\"]?([-\d\.]+)['\"]?\)", r"\1", match.group(1))
    estimates = eval(cleaned, {"Decimal": float, "null": None, "true": True, "false": False, "nan": None})
    print(json.dumps(estimates, indent=2, default=str))
