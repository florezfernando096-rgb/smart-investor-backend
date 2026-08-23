#!/usr/bin/env python3
import re
with open("estimates_table_rendered_code.js") as f:
    code = f.read()

for m in re.finditer(r'(?:var|let)?\s*dcf_free_cash_flow\s*=', code):
    start = max(0, m.start() - 100)
    end = min(len(code), m.end() + 300)
    print("--- ENCONTRADO dcf_free_cash_flow ---")
    print(code[start:end])
