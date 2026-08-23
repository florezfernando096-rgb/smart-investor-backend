/**
 * Definiciones de tipos para el Dashboard Financiero Móvil (Single Screen)
 */

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PriceHeaderData {
  price: number;
  currency: string;
  change: number;
  change_percent: number;
  postmarket_price: number;
  postmarket_change: number;
  postmarket_percent: number;
  is_positive: boolean;
}

export interface PriceChartData {
  timeframe_1y: {
    candles: PricePoint[];
    min_price: number;
    max_price: number;
    current: number;
  };
  timeframe_10y: {
    candles: PricePoint[];
    min_price: number;
    max_price: number;
    current: number;
  };
}

export interface KpiItem {
  label: string;
  value: string;
  icon?: string;
}

export interface FairValueData {
  consensus_fair_value: number;
  current_price: number;
  undervalued_percentage: number;
  status: 'Subvaluada' | 'Sobrevaluada';
  dcf_model: number;
  eps_model: number;
  morningstar_fair_value: number;
  morningstar_rating: string;
  tsi_rating: string;
}

export interface TechnicalIndicatorsData {
  rsi: {
    value: number;
    status: 'Sobrecompra' | 'Sobreventa' | 'Neutral';
    color: string;
  };
  ma20: {
    value: number;
    diff_pct: number;
    bullish: boolean;
  };
  ma50: {
    value: number;
    diff_pct: number;
    bullish: boolean;
  };
  ma200: {
    value: number;
    diff_pct: number;
    bullish: boolean;
  };
}

export interface FinancialsChartsData {
  period_type: 'annual' | 'quarterly';
  periods: string[];
  chart1_rev_gp: {
    revenues: number[];
    gross_profit_ratio: number[];
    periods: string[];
  };
  chart2_rev_net: {
    revenues: number[];
    net_income: number[];
    periods: string[];
  };
  chart3_margins: {
    gross_margin: number[];
    net_margin: number[];
    ebitda_margin: number[];
    periods: string[];
  };
  chart4_eps: {
    eps: number[];
    periods: string[];
  };
  chart5_shares: {
    shares: number[];
    periods: string[];
  };
  chart6_debt_solvency: {
    total_debt: number[];
    cash: number[];
    net_debt: number[];
    periods: string[];
  };
  chart7_fcf: {
    fcf: number[];
    growth_yoy: number[];
    periods: string[];
  };
}

export interface RatioSeries {
  label: string;
  data: number[];
}

export interface HistoricalRatiosData {
  years: string[];
  pe_ratio: RatioSeries;
  ps_ratio: RatioSeries;
  pb_ratio: RatioSeries;
  ev_ebitda: RatioSeries;
  pfcf_ratio: RatioSeries;
  ev_sales: RatioSeries;
  dividend_yield: RatioSeries;
  debt_equity: RatioSeries;
}

export interface EstimatesChartsData {
  periods_5y: string[];
  chart_e1_growth: {
    revenues: number[];
    ebitda: number[];
    net_income: number[];
    periods: string[];
  };
  chart_e2_valuation: {
    eps_projected: number[];
    forward_pe: number[];
    periods: string[];
  };
  chart_e3_fcf: {
    fcf_projected: number[];
    periods: string[];
  };
}

export interface DashboardResponse {
  status: 'success' | 'error';
  symbol: string;
  company_name: string;
  price_header: PriceHeaderData;
  price_chart: PriceChartData;
  kpis_summary: KpiItem[];
  fair_value: FairValueData;
  technical_indicators: TechnicalIndicatorsData;
  financials: FinancialsChartsData;
  historical_ratios: HistoricalRatiosData;
  estimates: EstimatesChartsData;
  message?: string;
}
