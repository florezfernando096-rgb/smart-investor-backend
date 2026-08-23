import pytest
from fastapi.testclient import TestClient
from app import app
from config import parse_cookie_string, update_cookie_setting
from scraper import SmartInvestorScraper, AuthenticationExpiredException, TickerNotFoundException

client = TestClient(app)

def test_cookie_parsing():
    cookie_str = "next-auth.session-token=secret123; remember_web=abc456; theme=dark"
    parsed = parse_cookie_string(cookie_str)
    assert parsed["next-auth.session-token"] == "secret123"
    assert parsed["remember_web"] == "abc456"
    assert parsed["theme"] == "dark"

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_status_endpoint():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "cookie_configured" in data
    assert "base_url" in data

def test_demo_financials():
    response = client.get("/api/financials?symbol=DEMO")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["symbol"] == "MSFT"
    assert "income_statement" in data["data"]
    assert "balance_sheet" in data["data"]
    assert "cash_flow" in data["data"]
    assert "ratios" in data["data"]
    assert "estimates" in data["data"]
    assert len(data["data"]["estimates"]["rows"]) == 12  # 6 métricas + 6 subfilas % Change YoY
    assert len(data["data"]["estimates"]["periods"]) == 11  # 5 años históricos + 5 años proyectados + columna Growth
    assert data["data"]["estimates"]["periods"][-1] == "Growth"
    assert "dcf_fair_value" in data["data"]["estimates"]["summary"]
    assert len(data["data"]["income_statement"]["rows"]) > 0

def test_mobile_dashboard_endpoint():
    response = client.get("/api/mobile/dashboard?symbol=DEMO")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["symbol"] == "MSFT"
    assert "price_header" in data
    assert "price_chart" in data
    assert "kpis_summary" in data
    assert len(data["kpis_summary"]) == 8
    assert "fair_value" in data
    assert "technical_indicators" in data
    assert "financials" in data
    assert "historical_ratios" in data
    assert "estimates" in data

def test_update_cookies_endpoint(monkeypatch):
    import config
    original = config.settings.COOKIE_STRING
    new_cookies = "test_cookie_1=val1; test_cookie_2=val2"
    response = client.post("/api/settings/cookies", json={"cookie_string": new_cookies})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["cookies_parsed_count"] >= 2
    # Restaurar
    config.update_cookie_setting(original)

def test_scraper_parsing():
    from bs4 import BeautifulSoup
    from unittest.mock import MagicMock
    
    scraper = SmartInvestorScraper(cookies={"test": "val"})

    # 1. Test parsing JSON endpoint (Income Statement / Balance Sheet / Cash Flow)
    mock_resp = MagicMock()
    mock_resp.headers = {"Content-Type": "application/json"}
    mock_resp.json.return_value = {
        "years": [{"title": ""}, {"title": "2024"}, {"title": "2023"}, {"title": "Total"}],
        "data": [
            ["Assets", "", "", ""],
            ["Cash & Equivalents", 75500000, 111260000, 186760000],
            ["Growth", "10.50%", "15.20%", ""],
            ["Total Current Assets", 158000000, 184260000, 342260000]
        ]
    }

    parsed = scraper._parse_json_endpoint(mock_resp, "Balance General")
    assert parsed["title"] == "Balance General"
    assert parsed["periods"] == ["2024", "2023"]
    assert len(parsed["rows"]) == 3  # Cash & Equivalents, % Change YoY (original de API), Total Current Assets
    assert parsed["rows"][0]["metric"] == "Cash & Equivalents"
    assert "$75.50B" in parsed["rows"][0]["values"][0]
    assert parsed["rows"][1]["metric"] == "% Change YoY"
    assert "10.50%" in parsed["rows"][1]["values"][0]

    # 2. Test parsing Company & KPIs from HTML
    sample_html = """
    <!DOCTYPE html>
    <html>
      <head><title>Microsoft (MSFT) Financials</title></head>
      <body>
        <h1>Microsoft (MSFT)</h1>
        <table><tr><td>Market Cap</td><td>3.59T</td></tr></table>
        <table><tr><td>Altman Z-Score</td><td>8.65</td></tr></table>
        <span>$483.50</span>
      </body>
    </html>
    """
    soup = BeautifulSoup(sample_html, "html.parser")
    company = scraper._extract_company_from_html(soup, "MSFT")
    assert "Microsoft" in company["name"]
    assert company["price"] == "$483.50"

    kpis = scraper._extract_kpis_from_html(soup)
    assert kpis.get("Market Cap") == "3.59T"
    assert kpis.get("Altman Z-Score") == "8.65"

def test_home_page_rendering():
    response = client.get("/")
    assert response.status_code == 200
    assert "Smart Investor Hub" in response.text
    assert "Estado de Resultados" in response.text
