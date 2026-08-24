/**
 * Capa de Servicios: Conexión Automática a Cloudflare Public HTTPS + Local IP + Scraper Directo
 */

import { DashboardResponse } from '../types/dashboard';
import {
  fetchDirectFromSmartInvestor,
  getActiveCookieString,
  setActiveCookieString,
} from './directScraperService';

export { getActiveCookieString, setActiveCookieString };

// Endpoint permanente en la nube (Render 24/7 Gratis)
const RENDER_CLOUD_URL = 'https://smart-investor-backend-acv6.onrender.com';
const CLOUDFLARE_TUNNEL_URL = 'https://dna-classical-cam-qualified.trycloudflare.com';

let customServerUrl: string = RENDER_CLOUD_URL;

export function setCustomServerUrl(url: string) {
  customServerUrl = url.trim().replace(/\/+$/, '');
}

export function getCustomServerUrl(): string {
  return customServerUrl;
}

export async function fetchDashboardData(
  symbol: string = 'MSFT',
  periodType: 'annual' | 'quarterly' = 'annual',
  serverUrlOverride?: string
): Promise<{ data: DashboardResponse; isDemo: boolean; errorMsg?: string; source: 'cloud' | 'local' | 'direct' | 'demo' }> {
  const cleanSymbol = symbol.trim().toUpperCase() || 'MSFT';

  // 1. Intentar Servidor HTTPS en la Nube (Render 24/7 o URL configurada)
  const targetBase = serverUrlOverride || customServerUrl;
  const urlCandidates = [
    targetBase,
    RENDER_CLOUD_URL,
    CLOUDFLARE_TUNNEL_URL,
    'http://192.168.1.7:8000',
    'http://10.0.2.2:8000',
    'http://localhost:8000',
  ];

  for (const base of Array.from(new Set(urlCandidates))) {
    try {
      const url = `${base}/api/mobile/dashboard?symbol=${cleanSymbol}&period_type=${periodType}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const serverData: DashboardResponse = await response.json();
        if (serverData && serverData.price_header && serverData.price_header.price > 0) {
          customServerUrl = base;
          const isCloud = base.includes('trycloudflare.com') || base.includes('http') && !base.includes('192.168.') && !base.includes('10.0.2.2') && !base.includes('localhost');
          return { data: serverData, isDemo: false, source: isCloud ? 'cloud' : 'local' };
        }
      }
    } catch {
      continue;
    }
  }

  // 2. Intentar Scraper Directo
  try {
    const directData = await fetchDirectFromSmartInvestor(cleanSymbol, periodType);
    if (directData && directData.price_header && directData.price_header.price > 0) {
      return { data: directData, isDemo: false, source: 'direct' };
    }
  } catch (err: any) {
    console.warn('[apiService] Intento directo falló:', err?.message || err);
  }

  // 3. Fallback: Datos interactivos de demostración
  const demoData = getOfflineDemoDashboard(cleanSymbol, periodType);
  return {
    data: demoData,
    isDemo: true,
    source: 'demo',
    errorMsg: 'Sin conexión a internet. Mostrando datos de demostración.',
  };
}

export interface LiveWatchlistQuote {
  symbol: string;
  company_name: string;
  price: number;
  change: number;
  change_percent: number;
  fair_value: number;
  forward_pe: number;
  status: 'success' | 'error';
}

export async function fetchWatchlistLiveQuotes(symbols: string[]): Promise<LiveWatchlistQuote[]> {
  if (!symbols || symbols.length === 0) return [];
  const cleanSymbols = symbols.map(s => s.trim().toUpperCase()).filter(Boolean).join(',');

  const urlCandidates = [
    customServerUrl,
    RENDER_CLOUD_URL,
    CLOUDFLARE_TUNNEL_URL,
    'http://192.168.1.7:8000',
    'http://10.0.2.2:8000',
    'http://localhost:8000',
  ];

  for (const base of Array.from(new Set(urlCandidates))) {
    try {
      const url = `${base}/api/mobile/watchlist/quotes?symbols=${cleanSymbols}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json && json.status === 'success' && Array.isArray(json.quotes)) {
          customServerUrl = base;
          return json.quotes as LiveWatchlistQuote[];
        }
      }
    } catch {
      // Intentar siguiente servidor
    }
  }

  return [];
}

export function getOfflineDemoDashboard(
  symbol: string = 'MSFT',
  periodType: 'annual' | 'quarterly' = 'annual'
): DashboardResponse {
  const isQtr = periodType === 'quarterly';
  const periods = isQtr ? ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025'] : ['2021', '2022', '2023', '2024', '2025', 'TTM'];

  const candles1Y = [];
  const basePrice = 480.0;
  for (let i = 0; i < 60; i++) {
    const val = basePrice + 35 * Math.sin(i * 0.2) + i * 0.4;
    candles1Y.push({
      date: `2025-${Math.floor(i / 15) + 1}-${(i % 28) + 1}`,
      open: Math.round((val - 1.2) * 100) / 100,
      high: Math.round((val + 2.5) * 100) / 100,
      low: Math.round((val - 2.8) * 100) / 100,
      close: Math.round(val * 100) / 100,
    });
  }

  return {
    status: 'success',
    symbol: symbol.toUpperCase(),
    company_name: `${symbol.toUpperCase()} Corporation`,
    price_header: {
      price: 483.24,
      currency: 'USD',
      change: 2.09,
      change_percent: 0.43,
      postmarket_price: 484.15,
      postmarket_change: 0.91,
      postmarket_percent: 0.19,
      is_positive: true,
    },
    price_chart: {
      timeframe_1y: {
        candles: candles1Y,
        min_price: 349.20,
        max_price: 553.72,
        current: 483.24,
      },
      timeframe_10y: {
        candles: candles1Y.filter((_, idx) => idx % 4 === 0),
        min_price: 140.50,
        max_price: 553.72,
        current: 483.24,
      },
    },
    kpis_summary: [
      { label: '52W Range', value: '$349.20 - $553.72' },
      { label: 'P/E (TTM)', value: '31.41x' },
      { label: 'P/E (FWD)', value: '26.85x' },
      { label: 'EPS (TTM)', value: '$15.38' },
      { label: 'Industry', value: 'Software - Infra' },
      { label: 'Market Cap', value: '$3.59T' },
      { label: 'Beta', value: '1.10' },
      { label: 'Sector', value: 'Technology' },
    ],
    fair_value: {
      consensus_fair_value: 283.20,
      current_price: 483.24,
      undervalued_percentage: -41.40,
      status: 'Sobrevaluada',
      dcf_model: 241.37,
      eps_model: 248.23,
      morningstar_fair_value: 360.00,
      morningstar_rating: 'Buy',
      tsi_rating: 'Hold',
    },
    technical_indicators: {
      rsi: { value: 54.2, status: 'Neutral', color: '#38bdf8' },
      ma20: { value: 473.09, diff_pct: 2.15, bullish: true },
      ma50: { value: 419.84, diff_pct: 15.10, bullish: true },
      ma200: { value: 431.31, diff_pct: 12.04, bullish: true },
    },
    financials: {
      period_type: periodType,
      periods,
      chart1_rev_gp: {
        revenues: [168.09, 198.27, 211.92, 245.12, 281.72, 331.84],
        gross_profit_ratio: [68.93, 68.40, 69.80, 70.10, 69.50, 70.40],
        periods,
      },
      chart2_rev_net: {
        revenues: [168.09, 198.27, 211.92, 245.12, 281.72, 331.84],
        net_income: [61.27, 72.74, 72.36, 88.14, 101.83, 133.75],
        periods,
      },
      chart3_margins: {
        gross_margin: [68.93, 68.40, 69.80, 70.10, 69.50, 70.40],
        net_margin: [36.45, 36.69, 34.14, 35.96, 36.15, 40.31],
        ebitda_margin: [49.50, 50.56, 49.61, 54.26, 56.85, 62.54],
        periods,
      },
      chart4_eps: {
        eps: [8.05, 9.70, 9.72, 11.86, 13.70, 18.00],
        periods,
      },
      chart5_shares: {
        shares: [7.61, 7.55, 7.47, 7.43, 7.42, 7.42],
        periods,
      },
      chart6_debt_solvency: {
        total_debt: [58.12, 59.97, 59.96, 58.74, 52.10, 47.00],
        cash: [130.33, 104.75, 111.26, 75.50, 80.20, 89.50],
        net_debt: [-72.21, -44.78, -51.30, -16.76, -28.10, -42.50],
        periods,
      },
      chart7_fcf: {
        fcf: [56.12, 65.15, 59.48, 74.07, 71.61, 66.99],
        growth_yoy: [16.5, 16.09, -8.71, 24.54, -3.32, -6.46],
        periods,
      },
    },
    historical_ratios: {
      years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
      pe_ratio: { label: 'P/E Ratio', data: [28.5, 30.2, 33.4, 35.8, 32.1, 27.4, 34.2, 36.1, 31.4, 33.2] },
      ps_ratio: { label: 'P/S Ratio', data: [6.8, 7.5, 8.4, 11.2, 12.4, 9.8, 11.5, 12.8, 11.9, 12.1] },
      pb_ratio: { label: 'P/B Ratio', data: [7.2, 8.1, 9.5, 13.4, 15.2, 11.1, 13.8, 14.5, 12.8, 13.4] },
      ev_ebitda: { label: 'EV/EBITDA', data: [18.2, 19.5, 21.4, 25.1, 26.8, 20.4, 24.5, 26.2, 23.8, 24.9] },
      pfcf_ratio: { label: 'Price / Free Cash Flow', data: [24.1, 26.8, 30.5, 38.2, 42.1, 33.4, 39.8, 43.1, 38.5, 41.2] },
      ev_sales: { label: 'EV / Sales', data: [6.5, 7.2, 8.1, 10.8, 12.1, 9.5, 11.2, 12.4, 11.5, 11.8] },
      dividend_yield: { label: 'Dividend Yield (%)', data: [1.8, 1.6, 1.4, 1.1, 0.9, 1.1, 0.9, 0.8, 0.7, 0.8] },
      debt_equity: { label: 'Debt / Equity', data: [0.65, 0.58, 0.52, 0.48, 0.44, 0.41, 0.40, 0.38, 0.35, 0.32] },
    },
    estimates: {
      periods: ['2027E', '2028E', '2029E', '2030E', '2031E', 'Growth'],
      metrics: [
        { label: 'Revenues', values: ['$391.08B', '$468.01B', '$567.25B', '$656.88B', '$738.37B', '—'], yoy: ['+17.85%', '+19.67%', '+21.20%', '+15.80%', '+12.41%', '+17.39%'] },
        { label: 'EBITDA', values: ['$239.93B', '$295.38B', '$369.74B', '$440.66B', '$449.96B', '—'], yoy: ['+15.62%', '+23.11%', '+25.17%', '+19.18%', '+2.11%', '+17.04%'] },
        { label: 'Net Income', values: ['$146.86B', '$175.38B', '$213.62B', '$253.69B', '$305.91B', '—'], yoy: ['+9.80%', '+19.43%', '+21.80%', '+18.76%', '+20.58%', '+18.07%'] },
        { label: 'Diluted EPS', values: ['$19.69', '$23.62', '$28.76', '$34.06', '$41.46', '—'], yoy: ['+9.39%', '+19.95%', '+21.76%', '+18.43%', '+21.74%', '+18.25%'] },
        { label: 'Forward P/E Ratio', values: ['24.5x', '20.5x', '16.8x', '14.2x', '11.7x', '—'], yoy: ['—', '-16.3%', '-18.0%', '-15.5%', '-17.6%', '—'] },
        { label: 'Free Cash Flow', values: ['$32.25B', '$45.51B', '$87.62B', '$112.16B', '$156.11B', '—'], yoy: ['-51.85%', '+41.11%', '+92.53%', '+28.00%', '+39.19%', '+29.80%'] },
        { label: 'Dividends', values: ['$3.90', '$4.26', '$4.42', '$5.12', '$4.83', '—'], yoy: ['—', '+9.28%', '+3.79%', '+15.80%', '-5.66%', '+4.64%'] },
      ],
    },
  };
}
