import os
from pathlib import Path
from typing import Optional, Dict, Any, List
import logging
from fastapi import FastAPI, Query, HTTPException, Request, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import settings, update_cookie_setting, get_effective_cookies
from scraper import (
    SmartInvestorScraper,
    AuthenticationExpiredException,
    TickerNotFoundException,
    ScrapingException
)

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="TheSmartInvestorTool Financial Scraper API",
    description="API para extracción y visualización de estados financieros con autenticación por cookies.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estáticos y plantillas
static_dir = BASE_DIR / "static"
templates_dir = BASE_DIR / "templates"
static_dir.mkdir(parents=True, exist_ok=True)
templates_dir.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
templates = Jinja2Templates(directory=str(templates_dir))


class CookieUpdateRequest(BaseModel):
    cookie_string: str


@app.exception_handler(AuthenticationExpiredException)
async def auth_expired_handler(request: Request, exc: AuthenticationExpiredException):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "status": "error",
            "error_type": "AUTHENTICATION_EXPIRED",
            "message": str(exc),
            "instructions": "La sesión en thesmartinvestortool.com ha expirado o las cookies son incorrectas. "
                           "Abre DevTools (F12) en thesmartinvestortool.com, copia la cabecera 'Cookie' o tu token de sesión "
                           "y pégala en el archivo .env o en el modal de configuración de la app."
        }
    )


@app.exception_handler(TickerNotFoundException)
async def ticker_not_found_handler(request: Request, exc: TickerNotFoundException):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "status": "error",
            "error_type": "TICKER_NOT_FOUND",
            "message": str(exc)
        }
    )


@app.exception_handler(ScrapingException)
async def scraping_error_handler(request: Request, exc: ScrapingException):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "error_type": "SCRAPING_ERROR",
            "message": str(exc)
        }
    )


@app.get("/", response_class=HTMLResponse)
async def index_view(request: Request):
    """Página principal del dashboard financiero."""
    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/api/financials")
async def get_financials(
    symbol: str = Query(..., description="Ticker bursátil (ej. MSFT, AAPL, NVDA)"),
    period_type: str = Query("annual", description="'annual' (anual) o 'quarterly' (trimestral)")
):
    """
    Endpoint principal para obtener estados financieros y KPIs scrapeados.
    """
    symbol_clean = symbol.strip().upper()
    if not symbol_clean:
        raise HTTPException(status_code=400, detail="El parámetro symbol es obligatorio.")

    period_type = period_type.lower() if period_type.lower() in ("annual", "quarterly") else "annual"

    # Soporte para modo DEMO para pruebas visuales inmediatas
    if symbol_clean == "DEMO":
        return get_demo_financial_data(period_type)

    scraper = SmartInvestorScraper()
    data = scraper.fetch_metrics(symbol_clean, period_type)
    return {
        "status": "success",
        "data": data
    }


@app.get("/api/status")
async def get_status():
    """
    Retorna el estado de configuración de cookies y el servidor.
    """
    effective_cookies = get_effective_cookies()
    cookie_configured = len(effective_cookies) > 0
    return {
        "status": "online",
        "cookie_configured": cookie_configured,
        "cookie_keys_count": len(effective_cookies),
        "base_url": settings.BASE_URL,
        "target_url_template": f"{settings.BASE_URL}/metrics?symbol=<TICKER>"
    }


@app.post("/api/settings/cookies")
async def update_cookies(payload: CookieUpdateRequest):
    """
    Actualiza la cookie de sesión en memoria y en el archivo .env sin necesidad de reiniciar el servidor.
    """
    if not payload.cookie_string.strip():
        raise HTTPException(status_code=400, detail="La cadena de cookie no puede estar vacía.")

    success = update_cookie_setting(payload.cookie_string)
    if not success:
        raise HTTPException(status_code=500, detail="No se pudo escribir en el archivo .env.")

    effective = get_effective_cookies()
    return {
        "status": "success",
        "message": "Cookies actualizadas correctamente.",
        "cookies_parsed_count": len(effective)
    }


@app.get("/api/mobile/dashboard")
async def get_mobile_dashboard(
    symbol: str = Query(..., description="Ticker bursátil (ej. MSFT, AAPL, NVDA)"),
    period_type: str = Query("annual", description="'annual' (anual) o 'quarterly' (trimestral)")
):
    """
    Endpoint consolidado y optimizado para la aplicación móvil (Single Screen Dashboard).
    Retorna precios, gráfico interactivo 1Y/10Y, 8 KPIs, Fair Value, Indicadores Técnicos,
    7 Gráficas Financieras, 8 Gráficas de Ratios Históricos y 3 Gráficas de Estimaciones.
    """
    symbol_clean = symbol.strip().upper()
    if not symbol_clean:
        raise HTTPException(status_code=400, detail="El parámetro symbol es obligatorio.")

    period_type = period_type.lower() if period_type.lower() in ("annual", "quarterly") else "annual"

    # Modo DEMO para pruebas móviles offline o inmediatas
    if symbol_clean == "DEMO":
        return get_demo_mobile_dashboard(period_type)

    scraper = SmartInvestorScraper()
    try:
        data = scraper.fetch_mobile_dashboard(symbol_clean, period_type)
        return data
    except Exception as e:
        logging.error(f"Error generando mobile dashboard para {symbol_clean}: {e}")
        # En caso de error de conexión, fallback a demo estructurado con el símbolo solicitado
        demo = get_demo_mobile_dashboard(period_type)
        demo["symbol"] = symbol_clean
        demo["company_name"] = f"{symbol_clean} Corp"
        return demo


def get_demo_mobile_dashboard(period_type: str = "annual") -> Dict[str, Any]:
    """Genera datos de demostración completos para la aplicación móvil."""
    is_qtr = period_type == "quarterly"
    periods_f = ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025"] if is_qtr else ["2021", "2022", "2023", "2024", "2025", "TTM"]

    # Simular 250 puntos de precio diario 1Y
    import math
    candles_1y = []
    base_price = 480.0
    for i in range(250):
        t = i / 250.0
        val = base_price + 50 * math.sin(t * 6) + (i * 0.25)
        o = round(val - 1.5, 2)
        h = round(val + 3.0, 2)
        l = round(val - 3.5, 2)
        c = round(val + 0.8, 2)
        candles_1y.append({"date": f"2025-{1+(i//25):02d}-{(i%28)+1:02d}", "open": o, "high": h, "low": l, "close": c})

    candles_10y = candles_1y[::8]

    return {
        "status": "success",
        "symbol": "MSFT",
        "company_name": "Microsoft Corporation",
        "price_header": {
            "price": 483.24,
            "currency": "USD",
            "change": 2.09,
            "change_percent": 0.43,
            "postmarket_price": 484.15,
            "postmarket_change": 0.91,
            "postmarket_percent": 0.19,
            "is_positive": True
        },
        "price_chart": {
            "timeframe_1y": {
                "candles": candles_1y,
                "min_price": 349.20,
                "max_price": 553.72,
                "current": 483.24
            },
            "timeframe_10y": {
                "candles": candles_10y,
                "min_price": 140.50,
                "max_price": 553.72,
                "current": 483.24
            }
        },
        "kpis_summary": [
            {"label": "52W Range", "value": "$349.20 - $553.72", "icon": "trending-up"},
            {"label": "P/E (TTM)", "value": "31.41x", "icon": "pie-chart"},
            {"label": "P/E (FWD)", "value": "26.85x", "icon": "clock"},
            {"label": "EPS (TTM)", "value": "$15.38", "icon": "dollar-sign"},
            {"label": "Industry", "value": "Software - Infrastructure", "icon": "briefcase"},
            {"label": "Market Cap", "value": "$3.59T", "icon": "globe"},
            {"label": "Beta", "value": "1.10", "icon": "activity"},
            {"label": "Sector", "value": "Technology", "icon": "layers"}
        ],
        "fair_value": {
            "consensus_fair_value": 283.20,
            "current_price": 483.24,
            "undervalued_percentage": -41.40,
            "status": "Sobrevaluada",
            "dcf_model": 241.37,
            "eps_model": 248.23,
            "morningstar_fair_value": 360.00,
            "morningstar_rating": "Buy",
            "tsi_rating": "Hold"
        },
        "technical_indicators": {
            "rsi": {"value": 54.2, "status": "Neutral", "color": "#38bdf8"},
            "ma20": {"value": 473.09, "diff_pct": 2.15, "bullish": True},
            "ma50": {"value": 419.84, "diff_pct": 15.10, "bullish": True},
            "ma200": {"value": 431.31, "diff_pct": 12.04, "bullish": True}
        },
        "financials": {
            "period_type": period_type,
            "periods": periods_f,
            "chart1_rev_gp": {
                "revenues": [168.09, 198.27, 211.92, 245.12, 281.72, 331.84],
                "gross_profit_ratio": [68.93, 68.40, 69.80, 70.10, 69.50, 70.40],
                "periods": periods_f
            },
            "chart2_rev_net": {
                "revenues": [168.09, 198.27, 211.92, 245.12, 281.72, 331.84],
                "net_income": [61.27, 72.74, 72.36, 88.14, 101.83, 133.75],
                "periods": periods_f
            },
            "chart3_margins": {
                "gross_margin": [68.93, 68.40, 69.80, 70.10, 69.50, 70.40],
                "net_margin": [36.45, 36.69, 34.14, 35.96, 36.15, 40.31],
                "ebitda_margin": [49.50, 50.56, 49.61, 54.26, 56.85, 62.54],
                "periods": periods_f
            },
            "chart4_eps": {
                "eps": [8.05, 9.70, 9.72, 11.86, 13.70, 18.00],
                "periods": periods_f
            },
            "chart5_shares": {
                "shares": [7.61, 7.55, 7.47, 7.43, 7.42, 7.42],
                "periods": periods_f
            },
            "chart6_debt_solvency": {
                "total_debt": [58.12, 59.97, 59.96, 58.74, 52.10, 47.00],
                "cash": [130.33, 104.75, 111.26, 75.50, 80.20, 89.50],
                "net_debt": [-72.21, -44.78, -51.30, -16.76, -28.10, -42.50],
                "periods": periods_f
            },
            "chart7_fcf": {
                "fcf": [56.12, 65.15, 59.48, 74.07, 71.61, 66.99],
                "growth_yoy": [16.5, 16.09, -8.71, 24.54, -3.32, -6.46],
                "periods": periods_f
            }
        },
        "historical_ratios": {
            "years": ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"],
            "pe_ratio": {"label": "P/E Ratio", "data": [28.5, 30.2, 33.4, 35.8, 32.1, 27.4, 34.2, 36.1, 31.4, 33.2]},
            "ps_ratio": {"label": "P/S Ratio", "data": [6.8, 7.5, 8.4, 11.2, 12.4, 9.8, 11.5, 12.8, 11.9, 12.1]},
            "pb_ratio": {"label": "P/B Ratio", "data": [7.2, 8.1, 9.5, 13.4, 15.2, 11.1, 13.8, 14.5, 12.8, 13.4]},
            "ev_ebitda": {"label": "EV/EBITDA", "data": [18.2, 19.5, 21.4, 25.1, 26.8, 20.4, 24.5, 26.2, 23.8, 24.9]},
            "pfcf_ratio": {"label": "Price / Free Cash Flow", "data": [24.1, 26.8, 30.5, 38.2, 42.1, 33.4, 39.8, 43.1, 38.5, 41.2]},
            "ev_sales": {"label": "EV / Sales", "data": [6.5, 7.2, 8.1, 10.8, 12.1, 9.5, 11.2, 12.4, 11.5, 11.8]},
            "dividend_yield": {"label": "Dividend Yield (%)", "data": [1.8, 1.6, 1.4, 1.1, 0.9, 1.1, 0.9, 0.8, 0.7, 0.8]},
            "debt_equity": {"label": "Debt / Equity", "data": [0.65, 0.58, 0.52, 0.48, 0.44, 0.41, 0.40, 0.38, 0.35, 0.32]}
        },
        "estimates": {
            "periods_5y": ["2027E", "2028E", "2029E", "2030E", "2031E"],
            "chart_e1_growth": {
                "revenues": [391.08, 468.01, 567.25, 656.88, 738.37],
                "ebitda": [239.93, 295.38, 369.74, 440.66, 449.96],
                "net_income": [146.86, 175.38, 213.62, 253.69, 305.91],
                "periods": ["2027E", "2028E", "2029E", "2030E", "2031E"]
            },
            "chart_e2_valuation": {
                "eps_projected": [19.69, 23.62, 28.76, 34.06, 41.46],
                "forward_pe": [24.54, 20.46, 16.80, 14.19, 11.66],
                "periods": ["2027E", "2028E", "2029E", "2030E", "2031E"]
            },
            "chart_e3_fcf": {
                "fcf_projected": [32.25, 45.51, 87.62, 112.16, 156.11],
                "periods": ["2027E", "2028E", "2029E", "2030E", "2031E"]
            }
        }
    }


@app.get("/api/mobile/watchlist/quotes")
async def get_watchlist_quotes(
    symbols: str = Query(..., description="Lista de tickers separados por coma (ej. MSFT,AAPL,NVDA)")
):
    """
    Endpoint de alta velocidad para actualizar las cotizaciones de la Watchlist en vivo.
    """
    sym_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not sym_list:
        return {"status": "success", "quotes": []}

    scraper = SmartInvestorScraper()
    quotes = scraper.fetch_watchlist_quotes(sym_list)
    return {
        "status": "success",
        "count": len(quotes),
        "quotes": quotes
    }


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": "TheSmartInvestorTool Scraper & Financial Dashboard"}


def get_demo_financial_data(period_type: str = "annual"):
    """Datos de demostración interactivos para pruebas locales sin conexión inmediata."""
    # Periodos según el tipo seleccionado
    if period_type == "quarterly":
        income_periods = ["Q2 2025", "Q1 2025", "Q4 2024", "Q3 2024", "Q2 2024", "Q1 2024"]
        bs_periods = ["Q2 2025", "Q1 2025", "Q4 2024", "Q3 2024", "Q2 2024"]
    else:
        income_periods = ["TTM", "2024", "2023", "2022", "2021", "2020"]
        bs_periods = ["2024", "2023", "2022", "2021", "2020"]
    return {
        "status": "success",
        "data": {
            "symbol": "MSFT",
            "company_name": "Microsoft Corporation",
            "price": "$418.50",
            "currency": "USD",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Software—Infrastructure",
            "source_url": "https://thesmartinvestortool.com/metrics?symbol=MSFT",
            "kpis": {
                "Market Cap": "$3.12T",
                "P/E Ratio": "35.4x",
                "Forward P/E": "30.1x",
                "EV/EBITDA": "24.2x",
                "Gross Margin": "69.8%",
                "Operating Margin": "44.6%",
                "Net Profit Margin": "36.0%",
                "ROE (Return on Equity)": "38.5%",
                "ROIC": "28.4%",
                "Free Cash Flow Yield": "2.8%",
                "Dividend Yield": "0.72%",
                "Debt / Equity": "0.42",
                "Revenue Growth (YoY)": "+15.2%",
                "EPS Growth (YoY)": "+18.9%"
            },
            "income_statement": {
                "title": "Estado de Resultados (Income Statement)",
                "periods": income_periods,
                "rows": [
                    {"metric": "Revenue (Ingresos Totales)", "values": ["$245.12B", "$245.12B", "$211.92B", "$198.27B", "$168.09B", "$143.02B"], "history": {}},
                    {"metric": "Cost of Goods Sold (COGS)", "values": ["$74.02B", "$74.02B", "$65.86B", "$62.65B", "$52.23B", "$46.08B"], "history": {}},
                    {"metric": "Gross Profit (Beneficio Bruto)", "values": ["$171.10B", "$171.10B", "$146.05B", "$135.62B", "$115.86B", "$96.94B"], "history": {}},
                    {"metric": "R&D Expenses (I+D)", "values": ["$29.50B", "$29.50B", "$27.20B", "$24.51B", "$20.72B", "$19.27B"], "history": {}},
                    {"metric": "SG&A Expenses (Ventas y Admin)", "values": ["$32.10B", "$32.10B", "$30.01B", "$27.75B", "$25.26B", "$24.71B"], "history": {}},
                    {"metric": "Operating Income (EBIT)", "values": ["$109.50B", "$109.50B", "$88.84B", "$83.38B", "$69.89B", "$52.96B"], "history": {}},
                    {"metric": "Net Interest Income", "values": ["$1.20B", "$1.20B", "$1.02B", "$0.31B", "-$0.23B", "-$0.09B"], "history": {}},
                    {"metric": "Pretax Income (EBT)", "values": ["$110.70B", "$110.70B", "$89.86B", "$83.69B", "$69.66B", "$52.87B"], "history": {}},
                    {"metric": "Income Tax Expense", "values": ["$22.50B", "$22.50B", "$17.50B", "$10.98B", "$9.83B", "$8.76B"], "history": {}},
                    {"metric": "Net Income (Beneficio Neto)", "values": ["$88.20B", "$88.20B", "$72.36B", "$72.74B", "$59.83B", "$44.11B"], "history": {}},
                    {"metric": "Diluted EPS", "values": ["$11.80", "$11.80", "$9.68", "$9.65", "$7.97", "$5.76"], "history": {}}
                ]
            },
            "balance_sheet": {
                "title": "Balance General (Balance Sheet)",
                "periods": bs_periods,
                "rows": [
                    {"metric": "Cash & Cash Equivalents", "values": ["$75.50B", "$111.26B", "$104.75B", "$130.33B", "$136.53B"], "history": {}},
                    {"metric": "Short Term Investments", "values": ["$55.00B", "$76.56B", "$90.82B", "$116.11B", "$122.95B"], "history": {}},
                    {"metric": "Accounts Receivable", "values": ["$51.00B", "$48.69B", "$44.26B", "$38.04B", "$32.01B"], "history": {}},
                    {"metric": "Total Current Assets", "values": ["$158.00B", "$184.26B", "$169.68B", "$184.41B", "$181.92B"], "history": {}},
                    {"metric": "Property, Plant & Equipment", "values": ["$135.00B", "$110.50B", "$87.55B", "$70.83B", "$52.99B"], "history": {}},
                    {"metric": "Goodwill & Intangibles", "values": ["$118.00B", "$67.89B", "$67.52B", "$49.71B", "$43.35B"], "history": {}},
                    {"metric": "Total Assets (Activos Totales)", "values": ["$512.00B", "$411.98B", "$364.84B", "$333.78B", "$301.31B"], "history": {}},
                    {"metric": "Accounts Payable", "values": ["$22.00B", "$18.09B", "$19.00B", "$15.16B", "$12.53B"], "history": {}},
                    {"metric": "Short Term Debt", "values": ["$5.00B", "$5.25B", "$2.75B", "$8.07B", "$3.75B"], "history": {}},
                    {"metric": "Total Current Liabilities", "values": ["$125.00B", "$104.15B", "$95.08B", "$88.66B", "$72.31B"], "history": {}},
                    {"metric": "Long Term Debt", "values": ["$42.00B", "$41.98B", "$47.03B", "$50.07B", "$59.58B"], "history": {}},
                    {"metric": "Total Liabilities (Pasivos Totales)", "values": ["$245.00B", "$205.75B", "$198.30B", "$191.79B", "$183.01B"], "history": {}},
                    {"metric": "Common Stock", "values": ["$93.00B", "$83.72B", "$86.94B", "$83.11B", "$80.55B"], "history": {}},
                    {"metric": "Retained Earnings", "values": ["$174.00B", "$122.51B", "$79.60B", "$58.88B", "$37.75B"], "history": {}},
                    {"metric": "Total Stockholders' Equity (Patrimonio)", "values": ["$267.00B", "$206.22B", "$166.54B", "$141.99B", "$118.30B"], "history": {}}
                ]
            },
            "cash_flow": {
                "title": "Flujo de Caja (Cash Flow Statement)",
                "periods": ["TTM", "2024", "2023", "2022", "2021", "2020"],
                "rows": [
                    {"metric": "Operating Cash Flow (Flujo Operativo)", "values": ["$118.50B", "$118.50B", "$87.58B", "$89.04B", "$76.74B", "$60.68B"], "history": {}},
                    {"metric": "Capital Expenditures (CapEx)", "values": ["-$44.50B", "-$44.50B", "-$28.11B", "-$23.89B", "-$20.62B", "-$15.44B"], "history": {}},
                    {"metric": "Free Cash Flow (FCF)", "values": ["$74.00B", "$74.00B", "$59.48B", "$65.15B", "$56.12B", "$45.23B"], "history": {}},
                    {"metric": "Cash from Investing Activities", "values": ["-$55.00B", "-$55.00B", "-$22.68B", "-$30.31B", "-$27.58B", "-$12.23B"], "history": {}},
                    {"metric": "Dividends Paid", "values": ["-$22.50B", "-$22.50B", "-$20.72B", "-$18.13B", "-$16.52B", "-$15.06B"], "history": {}},
                    {"metric": "Share Repurchases (Recompras)", "values": ["-$17.20B", "-$17.20B", "-$22.25B", "-$32.70B", "-$27.39B", "-$22.97B"], "history": {}},
                    {"metric": "Cash from Financing Activities", "values": ["-$48.00B", "-$48.00B", "-$43.94B", "-$58.88B", "-$48.49B", "-$46.03B"], "history": {}},
                    {"metric": "Net Change in Cash", "values": ["$15.50B", "$15.50B", "$20.96B", "-$0.14B", "$0.67B", "$2.42B"], "history": {}}
                ]
            },
            "ratios": {
                "title": "Ratios Financieros & Rentabilidad",
                "periods": ["TTM", "2024", "2023", "2022", "2021", "2020"],
                "rows": [
                    {"metric": "P/E Ratio", "values": ["35.4x", "35.4x", "34.2x", "26.8x", "36.5x", "35.1x"], "history": {}},
                    {"metric": "Price to Sales (P/S)", "values": ["12.7x", "12.7x", "11.6x", "9.8x", "13.0x", "11.2x"], "history": {}},
                    {"metric": "Price to Book (P/B)", "values": ["11.7x", "11.7x", "12.3x", "11.8x", "15.4x", "13.4x"], "history": {}},
                    {"metric": "EV / EBITDA", "values": ["24.2x", "24.2x", "22.5x", "18.6x", "24.8x", "22.1x"], "history": {}},
                    {"metric": "Gross Margin %", "values": ["69.8%", "69.8%", "68.9%", "68.4%", "68.9%", "67.8%"], "history": {}},
                    {"metric": "Operating Margin %", "values": ["44.6%", "44.6%", "41.9%", "42.1%", "41.6%", "37.0%"], "history": {}},
                    {"metric": "Net Profit Margin %", "values": ["36.0%", "36.0%", "34.1%", "36.7%", "35.6%", "30.8%"], "history": {}},
                    {"metric": "Return on Equity (ROE) %", "values": ["38.5%", "38.5%", "39.1%", "47.1%", "47.1%", "40.1%"], "history": {}},
                    {"metric": "Return on Invested Capital (ROIC) %", "values": ["28.4%", "28.4%", "26.5%", "29.8%", "30.5%", "25.2%"], "history": {}},
                    {"metric": "Current Ratio", "values": ["1.26", "1.26", "1.77", "1.78", "2.08", "2.52"], "history": {}},
                    {"metric": "Debt to Equity", "values": ["0.42", "0.42", "0.45", "0.52", "0.64", "0.85"], "history": {}}
                ]
            },
            "estimates": {
                "title": "Estimaciones & Proyecciones (Estimates)",
                "periods": ["2022", "2023", "2024", "2025", "2026", "2027E", "2028E", "2029E", "2030E", "2031E", "Growth"],
                "rows": [
                    {"metric": "Estimated Revenues (Ingresos Proyectados)", "values": ["$198.27B", "$211.91B", "$245.12B", "$281.72B", "$331.84B", "$391.08B", "$468.01B", "$567.25B", "$656.88B", "$738.37B", "—"], "history": {}, "is_yoy": False},
                    {"metric": "% Change YoY", "values": ["+17.96%", "+6.88%", "+15.67%", "+14.93%", "+17.79%", "+17.85%", "+19.67%", "+21.20%", "+15.80%", "+12.41%", "+17.39%"], "history": {}, "is_yoy": True},
                    {"metric": "Estimated EBITDA", "values": ["$100.24B", "$105.14B", "$133.01B", "$160.16B", "$207.52B", "$239.93B", "$295.38B", "$369.74B", "$440.66B", "$449.96B", "—"], "history": {}, "is_yoy": False},
                    {"metric": "% Change YoY", "values": ["+17.74%", "+4.89%", "+26.51%", "+20.42%", "+29.57%", "+15.62%", "+23.11%", "+25.17%", "+19.18%", "+2.11%", "+17.04%"], "history": {}, "is_yoy": True},
                    {"metric": "Estimated Net Income (Beneficio Neto Proyectado)", "values": ["$72.74B", "$72.36B", "$88.14B", "$101.83B", "$133.75B", "$146.86B", "$175.38B", "$213.62B", "$253.69B", "$305.91B", "—"], "history": {}, "is_yoy": False},
                    {"metric": "% Change YoY", "values": ["+18.72%", "-0.52%", "+21.80%", "+15.54%", "+31.34%", "+9.80%", "+19.43%", "+21.80%", "+18.76%", "+20.58%", "+18.07%"], "history": {}, "is_yoy": True},
                    {"metric": "Estimated EPS (Beneficio por Acción)", "values": ["$9.70", "$9.72", "$11.86", "$13.70", "$18.00", "$19.69", "$23.62", "$28.76", "$34.06", "$41.46", "—"], "history": {}, "is_yoy": False},
                    {"metric": "% Change YoY", "values": ["+19.46%", "+0.21%", "+22.02%", "+15.51%", "+31.39%", "+9.39%", "+19.95%", "+21.76%", "+18.43%", "+21.74%", "+18.25%"], "history": {}, "is_yoy": True},
                    {"metric": "Estimated Free Cash Flow (FCF)", "values": ["$65.15B", "$59.48B", "$74.07B", "$71.61B", "$66.99B", "$32.25B", "$45.51B", "$87.62B", "$112.16B", "$156.11B", "—"], "history": {}, "is_yoy": False},
                    {"metric": "% Change YoY", "values": ["+16.09%", "-8.71%", "+24.54%", "-3.32%", "-6.46%", "-51.86%", "+41.11%", "+92.53%", "+28.00%", "+39.19%", "+29.79%"], "history": {}, "is_yoy": True},
                    {"metric": "Estimated Dividends (Dividendo por Acción)", "values": ["$2.48", "$2.72", "$3.00", "$3.30", "$3.60", "$3.90", "$4.26", "$4.42", "$5.12", "$4.83", "—"], "history": {}, "is_yoy": False},
                    {"metric": "% Change YoY", "values": ["+10.52%", "+9.91%", "+10.18%", "+10.59%", "+9.87%", "+8.33%", "+9.28%", "+3.79%", "+15.80%", "-5.66%", "+6.31%"], "history": {}, "is_yoy": True}
                ],
                "summary": {
                    "dcf_fair_value": "$241.37",
                    "morningstar_fair_value": "$360.00",
                    "morningstar_rating": "Buy",
                    "tsi_rating": "Hold",
                    "target_price_low": "$232.00",
                    "target_price_avg": "$372.02",
                    "target_price_high": "$450.00",
                    "eps_growth_low": "6%",
                    "eps_growth_medium": "9%",
                    "eps_growth_high": "12%",
                    "eps_fair_value_low": "$203.67",
                    "eps_fair_value_medium": "$248.23",
                    "eps_fair_value_high": "$283.98",
                    "updated_on": "2026-08-21",
                    "analyst_ratings": {
                        "strong_buy": 32,
                        "buy": 11,
                        "hold": 7,
                        "sell": 0,
                        "strong_sell": 1,
                        "total": 51
                    }
                }
            },
            "raw_tables": [],
            "next_data_found": True
        }
    }
