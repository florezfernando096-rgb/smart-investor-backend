#!/usr/bin/env python3
"""
Simulación completa y exacta de las 6 métricas de Estimates con 10 años + Growth
tal como lo hace thesmartinvestortool.com.
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

estimates = extract_js_var("estimates", resp.text) or {}
full_income_statement = extract_js_var("full_income_statement", resp.text) or []
income_statement_growth = extract_js_var("income_statement_growth", resp.text) or []
financial_growth = extract_js_var("financial_growth", resp.text) or []
full_balance_sheet = extract_js_var("full_balance_sheet", resp.text) or []
full_cash_flow = extract_js_var("full_cash_flow", resp.text) or []

first_est_year = int(estimates.get('first_estimate_year', 2027))
start_year = first_est_year - 5

headers = []
for i in range(10):
    if i > 4:
        headers.append(f"{start_year + i}E")
    else:
        headers.append(f"{start_year + i}")
headers.append("Growth")

def fmt_m(val):
    if val is None or val == "" or val == "—":
        return "—"
    num = float(val)
    if num >= 1_000_000:
        return f"${num / 1_000_000:.2f}T"
    elif num >= 1_000:
        return f"${num / 1_000:.2f}B"
    elif num > 0:
        return f"${num:.2f}M"
    elif num < 0:
        abs_n = abs(num)
        return f"-${abs_n / 1_000:.2f}B" if abs_n >= 1_000 else f"-${abs_n:.2f}M"
    return "$0.00"

def fmt_share(val):
    if val is None or val == "" or val == "—":
        return "—"
    return f"${float(val):.2f}"

def fmt_pct(val):
    if val is None or val == "" or val == "-" or val == "—":
        return "—"
    num = float(val)
    sign = "+" if num > 0 else ""
    return f"{sign}{num:.2f}%"

# 1. Revenues
rev_hist = [full_income_statement[i]['revenue'] / 1_000_000 for i in range(min(4, len(full_income_statement)-1), -1, -1)]
rev_est = estimates.get('estimates_rev', [])
rev_combined = rev_hist + rev_est

rev_pct_hist = [income_statement_growth[i].get('growthRevenue', 0) * 100 for i in range(min(4, len(income_statement_growth)-1), -1, -1)]
rev_pct_est = []
rev_sum_pct = 0
for i in range(len(rev_hist), len(rev_combined)):
    prev = rev_combined[i-1]
    curr = rev_combined[i]
    if prev != 0:
        p = ((curr - prev) / abs(prev)) * 100
        rev_pct_est.append(p)
        rev_sum_pct += p
    else:
        rev_pct_est.append("—")
rev_growth_avg = rev_sum_pct / len(rev_est) if rev_est else 0

print("=== HEADERS ===")
print(headers)

print("\n1. Estimated Revenues:")
print("  Nominal:", [fmt_m(v) for v in rev_combined] + ["—"])
print("  YoY:", [fmt_pct(p) for p in rev_pct_hist + rev_pct_est] + [fmt_pct(rev_growth_avg)])

# 2. Net Income
net_hist = [full_income_statement[i]['netIncome'] / 1_000_000 for i in range(min(4, len(full_income_statement)-1), -1, -1)]
net_est = estimates.get('estimates_net_income', [])
net_combined = net_hist + net_est
net_pct_hist = [income_statement_growth[i].get('growthNetIncome', 0) * 100 for i in range(min(4, len(income_statement_growth)-1), -1, -1)]
net_pct_est = []
net_sum_pct = 0
for i in range(len(net_hist), len(net_combined)):
    prev = net_combined[i-1]
    curr = net_combined[i]
    if prev != 0:
        p = ((curr - prev) / abs(prev)) * 100
        net_pct_est.append(p)
        net_sum_pct += p
    else:
        net_pct_est.append("—")
net_growth_avg = net_sum_pct / len(net_est) if net_est else 0
print("\n2. Estimated Net Income:")
print("  Nominal:", [fmt_m(v) for v in net_combined] + ["—"])
print("  YoY:", [fmt_pct(p) for p in net_pct_hist + net_pct_est] + [fmt_pct(net_growth_avg)])

# 3. EPS
eps_hist = [full_income_statement[i]['eps'] for i in range(min(4, len(full_income_statement)-1), -1, -1)]
eps_est = estimates.get('estimates_eps', [])
eps_combined = eps_hist + eps_est
eps_pct_hist = [income_statement_growth[i].get('growthEPS', 0) * 100 for i in range(min(4, len(income_statement_growth)-1), -1, -1)]
eps_pct_est = []
eps_sum_pct = 0
for i in range(len(eps_hist), len(eps_combined)):
    prev = eps_combined[i-1]
    curr = eps_combined[i]
    if prev != 0:
        p = ((curr - prev) / abs(prev)) * 100
        eps_pct_est.append(p)
        eps_sum_pct += p
    else:
        eps_pct_est.append("—")
eps_growth_avg = eps_sum_pct / len(eps_est) if eps_est else 0
print("\n3. Estimated EPS:")
print("  Nominal:", [fmt_share(v) for v in eps_combined] + ["—"])
print("  YoY:", [fmt_pct(p) for p in eps_pct_hist + eps_pct_est] + [fmt_pct(eps_growth_avg)])

# 4. EBITDA
ebitda_hist = [full_income_statement[i]['ebitda'] / 1_000_000 for i in range(min(4, len(full_income_statement)-1), -1, -1)]
ebitda_est = estimates.get('estimates_ebitda', [])
ebitda_combined = ebitda_hist + ebitda_est
ebitda_pct_hist = [income_statement_growth[i].get('growthEBITDA', 0) * 100 for i in range(min(4, len(income_statement_growth)-1), -1, -1)]
ebitda_pct_est = []
ebitda_sum_pct = 0
for i in range(len(ebitda_hist), len(ebitda_combined)):
    prev = ebitda_combined[i-1]
    curr = ebitda_combined[i]
    if prev != 0:
        p = ((curr - prev) / abs(prev)) * 100
        ebitda_pct_est.append(p)
        ebitda_sum_pct += p
    else:
        ebitda_pct_est.append("—")
ebitda_growth_avg = ebitda_sum_pct / len(ebitda_est) if ebitda_est else 0
print("\n4. Estimated EBITDA:")
print("  Nominal:", [fmt_m(v) for v in ebitda_combined] + ["—"])
print("  YoY:", [fmt_pct(p) for p in ebitda_pct_hist + ebitda_pct_est] + [fmt_pct(ebitda_growth_avg)])

# 5. Free Cash Flow
fcf_hist = [full_cash_flow[i]['freeCashFlow'] / 1_000_000 for i in range(min(4, len(full_cash_flow)-1), -1, -1)]
fcf_est = estimates.get('estimates_fcf', [])
fcf_combined = fcf_hist + fcf_est
fcf_pct_hist = [financial_growth[i].get('freeCashFlowGrowth', 0) * 100 for i in range(min(4, len(financial_growth)-1), -1, -1)]
fcf_pct_est = []
fcf_sum_pct = 0
for i in range(len(fcf_hist), len(fcf_combined)):
    prev = fcf_combined[i-1]
    curr = fcf_combined[i]
    if prev != 0:
        p = ((curr - prev) / abs(prev)) * 100
        fcf_pct_est.append(p)
        fcf_sum_pct += p
    else:
        fcf_pct_est.append("—")
fcf_growth_avg = fcf_sum_pct / len(fcf_est) if fcf_est else 0
print("\n5. Estimated Free Cash Flow:")
print("  Nominal:", [fmt_m(v) for v in fcf_combined] + ["—"])
print("  YoY:", [fmt_pct(p) for p in fcf_pct_hist + fcf_pct_est] + [fmt_pct(fcf_growth_avg)])

# 6. Dividends
div_hist = []
for i in range(min(4, len(full_cash_flow)-1), -1, -1):
    div_hist.append(financial_growth[i].get('tenYDividendperShareGrowthPerShare', 0)) # or dividends
div_est = estimates.get('estimates_dividend', [])
div_combined = div_hist + div_est
div_pct_hist = [financial_growth[i].get('dividendsperShareGrowth', 0) * 100 for i in range(min(4, len(financial_growth)-1), -1, -1)]
div_pct_est = []
div_sum_pct = 0
for i in range(len(div_hist), len(div_combined)):
    prev = div_combined[i-1]
    curr = div_combined[i]
    if prev != 0:
        p = ((curr - prev) / abs(prev)) * 100
        div_pct_est.append(p)
        div_sum_pct += p
    else:
        div_pct_est.append("—")
div_growth_avg = div_sum_pct / len(div_est) if div_est else 0
print("\n6. Estimated Dividends:")
print("  Nominal:", [fmt_share(v) for v in div_combined] + ["—"])
print("  YoY:", [fmt_pct(p) for p in div_pct_hist + div_pct_est] + [fmt_pct(div_growth_avg)])
