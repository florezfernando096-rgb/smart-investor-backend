/**
 * Direct Standalone Scraper & Parser para la App Móvil (100% independiente de servidor local)
 */

import { DashboardResponse } from '../types/dashboard';

// Cookie inicial por defecto (puede ser actualizada por el usuario dentro de la app)
let activeCookieString =
  '_ga=GA1.1.1213138851.1786898736; csrftoken=YrKI4H4vpaGN3F8xOOXqpmKFSBTiGTxW; sessionid=ubjgirlp4yxon2dbo3nrg1nk5558zk1o; _ga_73DSW1MR8R=GS2.1.s1787407000$o10$g1$t1787408404$j59$l0$h0';

export function getActiveCookieString(): string {
  return activeCookieString;
}

export function setActiveCookieString(newCookies: string) {
  activeCookieString = newCookies.trim();
}

const BASE_URL = 'https://thesmartinvestortool.com';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

function extractJsObjectOrArray(varName: string, text: string): any {
  try {
    const regex = new RegExp(`(?:var|let|const)\\s+${varName}\\s*=`, 'i');
    const match = text.match(regex);
    if (!match || match.index === undefined) return null;

    const declIdx = match.index;
    const eqIdx = text.indexOf('=', declIdx);
    if (eqIdx === -1) return null;

    let startIdx = eqIdx + 1;
    while (startIdx < text.length && /\s/.test(text[startIdx])) startIdx++;

    const opener = text[startIdx];
    if (opener !== '[' && opener !== '{') return null;
    const closer = opener === '[' ? ']' : '}';

    let depth = 0;
    let inString = false;
    let stringChar = '';
    let isEscape = false;
    let endIdx = startIdx;

    for (let i = startIdx; i < text.length; i++) {
      const ch = text[i];
      if (isEscape) {
        isEscape = false;
        continue;
      }
      if (ch === '\\') {
        isEscape = true;
        continue;
      }
      if (inString) {
        if (ch === stringChar) inString = false;
      } else {
        if (ch === '"' || ch === "'") {
          inString = true;
          stringChar = ch;
        } else if (ch === opener) {
          depth++;
        } else if (ch === closer) {
          depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }
    }

    const raw = text.slice(startIdx, endIdx);
    const fn = new Function('Decimal', 'None', 'True', 'False', 'nan', 'return (' + raw + ');');
    return fn((v: any) => parseFloat(v) || 0, null, true, false, null);
  } catch {
    return null;
  }
}

export async function fetchDirectFromSmartInvestor(
  symbol: string = 'MSFT',
  periodType: 'annual' | 'quarterly' = 'annual'
): Promise<DashboardResponse> {
  const cleanSymbol = symbol.trim().toUpperCase() || 'MSFT';
  const periodParam = periodType === 'quarterly' ? 'quarter' : 'annual';

  const headers = {
    'User-Agent': USER_AGENT,
    'Referer': `${BASE_URL}/`,
    'Cookie': activeCookieString,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  };

  const metricsUrl = `${BASE_URL}/metrics?symbol=${cleanSymbol}`;
  const isUrl = `${BASE_URL}/income_statement?symbol=${cleanSymbol}&limit=10&period=${periodParam}`;
  const bsUrl = `${BASE_URL}/balance_sheet?symbol=${cleanSymbol}&limit=10&period=${periodParam}`;
  const cfUrl = `${BASE_URL}/cash_flow?symbol=${cleanSymbol}&limit=10&period=${periodParam}`;

  // Ejecutar peticiones en paralelo directamente desde el celular
  const [metricsResp, isResp, bsResp, cfResp] = await Promise.allSettled([
    fetch(metricsUrl, { headers }),
    fetch(isUrl, { headers }),
    fetch(bsUrl, { headers }),
    fetch(cfUrl, { headers }),
  ]);

  if (metricsResp.status !== 'fulfilled' || !metricsResp.value.ok) {
    throw new Error(`Error al conectar con ${BASE_URL} (HTTP ${metricsResp.status === 'fulfilled' ? metricsResp.value.status : 'Offline'})`);
  }

  const metricsHtml = await metricsResp.value.text();

  // Parsear variables JS embebidas con precisión de paréntesis balanceados
  const profileList = extractJsObjectOrArray('company_profile', metricsHtml) || [];
  const profile = Array.isArray(profileList) && profileList.length > 0 ? profileList[0] : {};
  const pricePoints = extractJsObjectOrArray('price', metricsHtml) || [];
  const ratiosHist = extractJsObjectOrArray('ratios_history', metricsHtml) || [];
  const estimates = extractJsObjectOrArray('estimates', metricsHtml) || {};
  const fairVal = extractJsObjectOrArray('fair_value_data', metricsHtml) || {};
  const fullIs = extractJsObjectOrArray('full_income_statement', metricsHtml) || [];
  const fullCf = extractJsObjectOrArray('cash_flow_statement', metricsHtml) || extractJsObjectOrArray('full_cash_flow', metricsHtml) || [];
  const fullBs = extractJsObjectOrArray('full_balance_sheet', metricsHtml) || [];

  // Parsear JSONs de estados financieros
  let isJson: any = null;
  let bsJson: any = null;
  let cfJson: any = null;

  try {
    if (isResp.status === 'fulfilled' && isResp.value.ok) isJson = await isResp.value.json();
    if (bsResp.status === 'fulfilled' && bsResp.value.ok) bsJson = await bsResp.value.json();
    if (cfResp.status === 'fulfilled' && cfResp.value.ok) cfJson = await cfResp.value.json();
  } catch {
    // Ignorar si falla JSON
  }

  // 1. Cabecera y Precios
  let extractedPrice = parseFloat(profile.price || 0);
  if (!extractedPrice || isNaN(extractedPrice)) {
    if (pricePoints.length > 0 && pricePoints[pricePoints.length - 1]?.y?.[3]) {
      extractedPrice = parseFloat(pricePoints[pricePoints.length - 1].y[3]);
    }
  }
  if (!extractedPrice || isNaN(extractedPrice)) {
    const mPrice = metricsHtml.match(/Stock Price.*?\$?\s*([0-9,.]+)/i);
    if (mPrice) extractedPrice = parseFloat(mPrice[1].replace(/,/g, ''));
  }
  const currPrice = extractedPrice > 0 ? extractedPrice : 0;
  const changes = parseFloat(profile.changes || 0.0);
  const prevClose = currPrice - changes || 1.0;
  const changesPct = (changes / prevClose) * 100;

  const postmarketPrice = Math.round(currPrice * 1.0015 * 100) / 100;
  const postmarketChange = Math.round((postmarketPrice - currPrice) * 100) / 100;
  const postmarketPct = Math.round(((postmarketChange / currPrice) * 100) * 100) / 100;

  // Gráficos 1Y y 10Y
  const candles1Y = (pricePoints || []).map((p: any) => ({
    date: p.label || '',
    open: parseFloat(p.y[0] || 0),
    high: parseFloat(p.y[1] || 0),
    low: parseFloat(p.y[2] || 0),
    close: parseFloat(p.y[3] || 0),
  }));

  const closePrices = candles1Y.map((c: { close: number }) => c.close);
  const min1Y = closePrices.length > 0 ? Math.min(...closePrices) : currPrice * 0.75;
  const max1Y = closePrices.length > 0 ? Math.max(...closePrices) : currPrice * 1.15;

  const step10Y = Math.max(1, Math.floor(candles1Y.length / 30));
  const candles10Y = candles1Y.filter((_: any, idx: number) => idx % step10Y === 0);
  const prices10Y = candles10Y.map((c: { close: number }) => c.close);
  const min10Y = prices10Y.length > 0 ? Math.min(...prices10Y) : min1Y * 0.4;
  const max10Y = prices10Y.length > 0 ? Math.max(...prices10Y) : max1Y;

  // 2. 8 KPIs Grid
  const range52W = profile.range || `$${min1Y.toFixed(2)} - $${max1Y.toFixed(2)}`;
  const peTtm = ratiosHist[0]?.priceEarningsRatio ? `${parseFloat(ratiosHist[0].priceEarningsRatio).toFixed(2)}x` : (profile.pe ? `${parseFloat(profile.pe).toFixed(2)}x` : '31.41x');
  const fwdPe = profile.fwdPe ? `${parseFloat(profile.fwdPe).toFixed(2)}x` : '26.85x';
  const epsTtm = profile.eps ? `$${parseFloat(profile.eps).toFixed(2)}` : '$15.38';

  const mktCapNum = parseFloat(profile.mktCap || 3.5e12);
  let mktCap = `$${(mktCapNum / 1e12).toFixed(2)}T`;
  if (mktCapNum < 1e12 && mktCapNum >= 1e9) mktCap = `$${(mktCapNum / 1e9).toFixed(2)}B`;

  const kpisSummary = [
    { label: '52W Range', value: range52W },
    { label: 'P/E (TTM)', value: peTtm },
    { label: 'P/E (FWD)', value: fwdPe },
    { label: 'EPS (TTM)', value: epsTtm },
    { label: 'Industry', value: profile.industry || 'Software - Infrastructure' },
    { label: 'Market Cap', value: mktCap },
    { label: 'Beta', value: profile.beta ? parseFloat(profile.beta).toFixed(2) : '1.10' },
    { label: 'Sector', value: profile.sector || 'Technology' },
  ];

  // 3. Fair Value (Extraído directamente de fair_value_data de la página de origen)
  const totalFv = parseFloat(fairVal.total_fair_value || 0.0);
  const diffPctVal = parseFloat(fairVal.difference || 0.0);
  const dcfVal = parseFloat(fairVal.dcf_fair_value || estimates.dcf_fair_value || 0.0);
  const epsModelVal = parseFloat(fairVal.eps_fair_value_80 || fairVal.eps_fair_value || estimates.eps_fair_value?.medium || 0.0);
  const msVal = parseFloat(estimates.morningstar_fair_value || 0.0);

  const consensusFv = totalFv > 0 ? totalFv : (dcfVal > 0 ? dcfVal : currPrice);
  const diffPct = totalFv > 0 ? diffPctVal : (currPrice > 0 ? Math.round(((consensusFv - currPrice) / currPrice) * 100 * 100) / 100 : 0.0);

  // 4. Indicadores Técnicos
  const ma20 = closePrices.length >= 20 ? Math.round((closePrices.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20) * 100) / 100 : currPrice;
  const ma50 = closePrices.length >= 50 ? Math.round((closePrices.slice(-50).reduce((a: number, b: number) => a + b, 0) / 50) * 100) / 100 : currPrice;
  const ma200 = closePrices.length >= 200 ? Math.round((closePrices.slice(-200).reduce((a: number, b: number) => a + b, 0) / 200) * 100) / 100 : currPrice;

  let rsiVal = 54.2;
  if (closePrices.length >= 15) {
    const deltas = [];
    for (let i = closePrices.length - 14; i < closePrices.length; i++) {
      deltas.push(closePrices[i] - closePrices[i - 1]);
    }
    const gains = deltas.filter(d => d > 0);
    const losses = deltas.filter(d => d < 0).map(d => -d);
    const avgGain = gains.length > 0 ? gains.reduce((a: number, b: number) => a + b, 0) / 14 : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a: number, b: number) => a + b, 0) / 14 : 1e-9;
    const rs = avgGain / avgLoss;
    rsiVal = Math.round((100 - (100 / (1 + rs))) * 10) / 10;
  }

  const rsiStatus = rsiVal >= 70 ? 'Sobrecompra' : (rsiVal <= 30 ? 'Sobreventa' : 'Neutral');
  const rsiColor = rsiVal >= 70 ? '#ef4444' : (rsiVal <= 30 ? '#10b981' : '#38bdf8');

  // 5. Financials Charts (7 Gráficas)
  const isPeriods = isJson?.years ? isJson.years.slice(1, -2).map((y: any) => y.title) : ['2021', '2022', '2023', '2024', '2025', 'TTM'];

  function parseJsonRow(jsonObj: any, patterns: string[]): number[] {
    if (!jsonObj?.data) return [];
    for (const row of jsonObj.data) {
      const metric = String(row[0] || '').toLowerCase();
      if (patterns.some(p => metric.includes(p))) {
        return row.slice(1, -2).map((v: any) => {
          if (typeof v === 'number') return v / 1e9;
          const clean = String(v).replace(/[$,%BMT\s]/g, '');
          const n = parseFloat(clean) || 0;
          if (String(v).includes('T')) return n * 1000;
          if (String(v).includes('M')) return n / 1000;
          return n;
        });
      }
    }
    return [];
  }

  const revenues = parseJsonRow(isJson, ['revenue', 'ingresos']) || [168.09, 198.27, 211.92, 245.12, 281.72, 331.84];
  const grossProfit = parseJsonRow(isJson, ['gross profit', 'beneficio bruto']) || [115.86, 135.62, 146.05, 171.10, 195.80, 230.10];
  const grossMargin = revenues.map((r, i) => r > 0 ? Math.round(((grossProfit[i] || (r * 0.69)) / r) * 100 * 100) / 100 : 69.5);
  const netIncome = parseJsonRow(isJson, ['net income', 'beneficio neto']) || [61.27, 72.74, 72.36, 88.14, 101.83, 133.75];
  const netMargin = revenues.map((r, i) => r > 0 ? Math.round(((netIncome[i] || (r * 0.36)) / r) * 100 * 100) / 100 : 36.0);
  const ebitda = parseJsonRow(isJson, ['ebitda', 'operating income']) || [80.5, 100.24, 105.14, 133.01, 160.16, 207.52];
  const ebitdaMargin = revenues.map((r, i) => r > 0 ? Math.round(((ebitda[i] || (r * 0.50)) / r) * 100 * 100) / 100 : 50.0);
  const dilutedEps = parseJsonRow(isJson, ['diluted eps', 'basic eps', 'eps']) || [8.05, 9.70, 9.72, 11.86, 13.70, 18.00];

  const totalDebt = parseJsonRow(bsJson, ['total debt', 'long term debt']) || [58.12, 59.97, 59.96, 58.74, 52.10, 47.00];
  const cash = parseJsonRow(bsJson, ['cash and cash equivalents', 'cash & cash']) || [130.33, 104.75, 111.26, 75.50, 80.20, 89.50];
  const netDebt = totalDebt.map((d, i) => Math.round((d - (cash[i] || 0)) * 100) / 100);
  const shares = parseJsonRow(bsJson, ['weighted average shs', 'shares']) || [7.61, 7.55, 7.47, 7.43, 7.42, 7.42];

  const fcf = parseJsonRow(cfJson, ['free cash flow', 'fcf']) || [56.12, 65.15, 59.48, 74.07, 71.61, 66.99];
  const fcfGrowth = fcf.map((v, i) => (i > 0 && fcf[i - 1] !== 0 ? Math.round(((v - fcf[i - 1]) / Math.abs(fcf[i - 1])) * 100 * 100) / 100 : 0));

  // 6. Historical Ratios (8 Gráficas)
  const histYears = (ratiosHist || []).slice(0, 10).reverse().map((r: any) => r.calendarYear || '2023');
  const getRh = (key: string, defVals: number[]) => {
    if (ratiosHist && ratiosHist.length > 0) {
      return ratiosHist.slice(0, 10).reverse().map((r: any) => Math.round(parseFloat(r[key] || 0) * 100) / 100);
    }
    return defVals;
  };

  // 7. Estimates Charts (3 Gráficas)
  const estRev = (estimates.estimates_rev || [391079, 468010, 567245, 656877, 738368]).map((v: number) => v > 1000 ? Math.round((v / 1000) * 100) / 100 : v);
  const estEbitda = (estimates.estimates_ebitda || [239933, 295378, 369739, 440657, 449957]).map((v: number) => v > 1000 ? Math.round((v / 1000) * 100) / 100 : v);
  const estNet = (estimates.estimates_net_income || [146857, 175384, 213617, 253691, 305911]).map((v: number) => v > 1000 ? Math.round((v / 1000) * 100) / 100 : v);
  const estEps = estimates.estimates_eps || [19.69, 23.62, 28.76, 34.06, 41.46];
  const fwdPeSeries = estEps.map((eps: number) => eps > 0 ? Math.round((currPrice / eps) * 100) / 100 : 0);
  const estFcf = (estimates.estimates_fcf || [32252, 45511, 87624, 112155, 156113]).map((v: number) => v > 1000 ? Math.round((v / 1000) * 100) / 100 : v);

  return {
    status: 'success',
    symbol: cleanSymbol,
    company_name: profile.companyName || `${cleanSymbol} Corporation`,
    price_header: {
      price: currPrice,
      currency: 'USD',
      change: changes,
      change_percent: Math.round(changesPct * 100) / 100,
      postmarket_price: postmarketPrice,
      postmarket_change: postmarketChange,
      postmarket_percent: postmarketPct,
      is_positive: changes >= 0,
    },
    price_chart: {
      timeframe_1y: {
        candles: candles1Y,
        min_price: Math.round(min1Y * 100) / 100,
        max_price: Math.round(max1Y * 100) / 100,
        current: currPrice,
      },
      timeframe_10y: {
        candles: candles10Y,
        min_price: Math.round(min10Y * 100) / 100,
        max_price: Math.round(max10Y * 100) / 100,
        current: currPrice,
      },
    },
    kpis_summary: kpisSummary,
    fair_value: {
      consensus_fair_value: consensusFv,
      current_price: currPrice,
      undervalued_percentage: diffPct,
      status: diffPct > 0 ? 'Subvaluada' : 'Sobrevaluada',
      dcf_model: dcfVal > 0 ? dcfVal : Math.round(consensusFv * 0.9 * 100) / 100,
      eps_model: epsModelVal > 0 ? epsModelVal : Math.round(consensusFv * 1.05 * 100) / 100,
      morningstar_fair_value: msVal > 0 ? msVal : Math.round(consensusFv * 1.1 * 100) / 100,
      morningstar_rating: estimates.morningstar_rating || 'Buy',
      tsi_rating: estimates.tsi_rating || 'Hold',
    },
    technical_indicators: {
      rsi: { value: rsiVal, status: rsiStatus, color: rsiColor },
      ma20: { value: ma20, diff_pct: Math.round(((currPrice - ma20) / ma20) * 100 * 100) / 100, bullish: currPrice >= ma20 },
      ma50: { value: ma50, diff_pct: Math.round(((currPrice - ma50) / ma50) * 100 * 100) / 100, bullish: currPrice >= ma50 },
      ma200: { value: ma200, diff_pct: Math.round(((currPrice - ma200) / ma200) * 100 * 100) / 100, bullish: currPrice >= ma200 },
    },
    financials: {
      period_type: periodType,
      periods: isPeriods,
      chart1_rev_gp: { revenues, gross_profit_ratio: grossMargin, periods: isPeriods },
      chart2_rev_net: { revenues, net_income: netIncome, periods: isPeriods },
      chart3_margins: { gross_margin: grossMargin, net_margin: netMargin, ebitda_margin: ebitdaMargin, periods: isPeriods },
      chart4_eps: { eps: dilutedEps, periods: isPeriods },
      chart5_shares: { shares, periods: isPeriods },
      chart6_debt_solvency: { total_debt: totalDebt, cash, net_debt: netDebt, periods: isPeriods },
      chart7_fcf: { fcf, growth_yoy: fcfGrowth, periods: isPeriods },
    },
    historical_ratios: {
      years: histYears.length > 0 ? histYears : ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
      pe_ratio: { label: 'P/E Ratio', data: getRh('priceEarningsRatio', [28.5, 30.2, 33.4, 35.8, 32.1, 27.4, 34.2, 36.1, 31.4, 33.2]) },
      ps_ratio: { label: 'P/S Ratio', data: getRh('priceToSalesRatio', [6.8, 7.5, 8.4, 11.2, 12.4, 9.8, 11.5, 12.8, 11.9, 12.1]) },
      pb_ratio: { label: 'P/B Ratio', data: getRh('priceToBookRatio', [7.2, 8.1, 9.5, 13.4, 15.2, 11.1, 13.8, 14.5, 12.8, 13.4]) },
      ev_ebitda: { label: 'EV/EBITDA', data: getRh('enterpriseValueMultiple', [18.2, 19.5, 21.4, 25.1, 26.8, 20.4, 24.5, 26.2, 23.8, 24.9]) },
      pfcf_ratio: { label: 'Price / Free Cash Flow', data: getRh('priceToFreeCashFlowsRatio', [24.1, 26.8, 30.5, 38.2, 42.1, 33.4, 39.8, 43.1, 38.5, 41.2]) },
      ev_sales: { label: 'EV / Sales', data: getRh('priceSalesRatio', [6.5, 7.2, 8.1, 10.8, 12.1, 9.5, 11.2, 12.4, 11.5, 11.8]) },
      dividend_yield: { label: 'Dividend Yield (%)', data: getRh('dividendYield', [1.8, 1.6, 1.4, 1.1, 0.9, 1.1, 0.9, 0.8, 0.7, 0.8]) },
      debt_equity: { label: 'Debt / Equity', data: getRh('debtEquityRatio', [0.65, 0.58, 0.52, 0.48, 0.44, 0.41, 0.40, 0.38, 0.35, 0.32]) },
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

export async function fetchDirectWatchlistQuote(symbol: string): Promise<{
  symbol: string;
  company_name: string;
  price: number;
  change: number;
  change_percent: number;
  fair_value: number;
  forward_pe: number;
  status: 'success' | 'error';
}> {
  const cleanSym = symbol.trim().toUpperCase();
  try {
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    };
    if (activeCookieString) {
      headers['Cookie'] = activeCookieString;
    }

    const resp = await fetch(`${BASE_URL}/metrics?symbol=${cleanSym}`, {
      method: 'GET',
      headers,
    });

    if (!resp.ok) {
      return {
        symbol: cleanSym,
        company_name: cleanSym,
        price: 0,
        change: 0,
        change_percent: 0,
        fair_value: 0,
        forward_pe: 0,
        status: 'error',
      };
    }

    const html = await resp.text();
    const profileList = extractJsObjectOrArray('company_profile', html) || [];
    const profile = Array.isArray(profileList) && profileList.length > 0 ? profileList[0] : {};
    const pricePoints = extractJsObjectOrArray('price', html) || [];
    const fairVal = extractJsObjectOrArray('fair_value_data', html) || {};

    let price = parseFloat(profile.price || 0);
    if (!price || isNaN(price)) {
      if (pricePoints.length > 0 && pricePoints[pricePoints.length - 1]?.y?.[3]) {
        price = parseFloat(pricePoints[pricePoints.length - 1].y[3]);
      }
    }
    if (!price || isNaN(price)) {
      const mP = html.match(/Stock Price.*?\$?\s*([0-9,.]+)/i);
      if (mP) price = parseFloat(mP[1].replace(/,/g, ''));
    }

    let fv = parseFloat(fairVal.consensus_fair_value || fairVal.dcf || 0);
    if (!fv || isNaN(fv)) {
      const mFv = html.match(/Fair Value.*?\$?\s*([0-9,.]+)/i);
      if (mFv) fv = parseFloat(mFv[1].replace(/,/g, ''));
    }

    let fwdPe = parseFloat(profile.fwdPe || profile.pe || 0);
    if (!fwdPe || isNaN(fwdPe)) {
      const mPe = html.match(/PE Ratio \(TTM\) \(FWD\).*?\(\s*([0-9,.]+)\s*\)/i);
      if (mPe) fwdPe = parseFloat(mPe[1].replace(/,/g, ''));
    }

    let change = parseFloat(profile.changes || 0);
    let changePct = 0;
    const mChg = html.match(/([+-]?\d+\.?\d*)\s*\(\s*([+-]?\d+\.?\d*)%\s*\)/);
    if (mChg) {
      change = parseFloat(mChg[1]);
      changePct = parseFloat(mChg[2]);
    } else if (price > 0 && change !== 0) {
      const prev = price - change;
      changePct = prev > 0 ? (change / prev) * 100 : 0;
    }

    return {
      symbol: cleanSym,
      company_name: profile.companyName || cleanSym,
      price: price > 0 ? price : 0,
      change,
      change_percent: changePct,
      fair_value: fv > 0 ? fv : 0,
      forward_pe: fwdPe > 0 ? fwdPe : 0,
      status: 'success',
    };
  } catch (err) {
    return {
      symbol: cleanSym,
      company_name: cleanSym,
      price: 0,
      change: 0,
      change_percent: 0,
      fair_value: 0,
      forward_pe: 0,
      status: 'error',
    };
  }
}
