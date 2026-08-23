/**
 * TheSmartInvestorTool Financial Dashboard Client Logic
 */

let currentData = null;
let activeTab = 'income_statement';
let lastSearchedTicker = '';
let activePeriod = 'annual'; // 'annual' | 'quarterly'

// DOM Elements
const searchForm = document.getElementById('searchForm');
const tickerInput = document.getElementById('tickerInput');
const loadingState = document.getElementById('loadingState');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const dashboardContent = document.getElementById('dashboardContent');
const welcomeState = document.getElementById('welcomeState');

// Company Header Elements
const companySymbol = document.getElementById('companySymbol');
const companyName = document.getElementById('companyName');
const companyPrice = document.getElementById('companyPrice');
const companySector = document.getElementById('companySector');
const companyExchange = document.getElementById('companyExchange');
const sourceLink = document.getElementById('sourceLink');

// KPI Grid
const kpiGrid = document.getElementById('kpiGrid');

// Table, Charts & Search Filter Elements
const tableTitle = document.getElementById('tableTitle');
const tableHeaderRow = document.getElementById('tableHeaderRow');
const tableBody = document.getElementById('tableBody');
const metricFilterInput = document.getElementById('metricFilterInput');
const jsonViewer = document.getElementById('jsonViewer');
const jsonCode = document.getElementById('jsonCode');
const tableContainerWrapper = document.getElementById('tableContainerWrapper');
const chartsContainer = document.getElementById('chartsContainer');
const estimatesBox = document.getElementById('estimatesSummaryBox');

// Cookie Modal & Status Elements
const cookieStatusPill = document.getElementById('cookieStatusPill');
const cookieModal = document.getElementById('cookieModal');
const cookieInput = document.getElementById('cookieInput');
const cookieSaveBtn = document.getElementById('cookieSaveBtn');
const cookieFeedback = document.getElementById('cookieFeedback');

// Period selector logic
function setPeriod(period) {
  activePeriod = period;
  
  // Update header buttons
  document.querySelectorAll('.period-btn').forEach(b => {
    if (b.dataset.period === period) {
      b.classList.add('bg-blue-600', 'text-white');
      b.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800');
    } else {
      b.classList.remove('bg-blue-600', 'text-white');
      b.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800');
    }
  });

  // Update in-table toggle buttons
  document.querySelectorAll('.period-toggle-btn').forEach(b => {
    if (b.dataset.period === period) {
      b.classList.add('bg-blue-600', 'text-white');
      b.classList.remove('text-slate-400', 'hover:text-slate-200');
    } else {
      b.classList.remove('bg-blue-600', 'text-white');
      b.classList.add('text-slate-400', 'hover:text-slate-200');
    }
  });

  // Re-consultar si ya hay un ticker activo
  if (lastSearchedTicker) {
    searchTicker(lastSearchedTicker);
  }
}

document.querySelectorAll('.period-btn, .period-toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setPeriod(btn.dataset.period);
  });
});

// Quick ticker buttons
document.querySelectorAll('.quick-ticker-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const symbol = btn.dataset.symbol;
    tickerInput.value = symbol;
    searchTicker(symbol);
  });
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  checkCookieStatus();
  setupTabs();
  setupEventListeners();

  // Si hay parámetro ?symbol en la URL, cargarlo automáticamente
  const urlParams = new URLSearchParams(window.location.search);
  const symbolParam = urlParams.get('symbol');
  if (symbolParam) {
    tickerInput.value = symbolParam;
    searchTicker(symbolParam);
  }
});

function setupEventListeners() {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const symbol = tickerInput.value.trim().toUpperCase();
    if (symbol) {
      searchTicker(symbol);
    }
  });

  metricFilterInput.addEventListener('input', (e) => {
    filterTableRows(e.target.value);
  });

  // Export Buttons
  document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);
  document.getElementById('copyJsonBtn').addEventListener('click', copyJSONToClipboard);

  // Cookie Modal Listeners
  document.getElementById('openCookieModalBtn').addEventListener('click', openCookieModal);
  document.getElementById('closeCookieModalBtn').addEventListener('click', closeCookieModal);
  cookieSaveBtn.addEventListener('click', handleSaveCookie);
}

// -----------------------------------------------------------------------------
// API & Data Fetching
// -----------------------------------------------------------------------------
async function checkCookieStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.cookie_configured) {
      cookieStatusPill.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5 cursor-pointer hover:bg-emerald-900 transition';
      cookieStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Sesión Configurada (${data.cookie_keys_count} cookies)`;
    } else {
      cookieStatusPill.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1.5 cursor-pointer hover:bg-amber-900 transition';
      cookieStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span> Sin Cookies (Click para añadir)`;
    }
  } catch (err) {
    console.error('Error al verificar estado de cookies:', err);
  }
}

async function searchTicker(symbol) {
  lastSearchedTicker = symbol;
  hideError();
  welcomeState.classList.add('hidden');
  dashboardContent.classList.add('hidden');
  loadingState.classList.remove('hidden');

  // Actualizar URL sin recargar
  window.history.pushState({}, '', `?symbol=${symbol}`);

  try {
    const res = await fetch(`/api/financials?symbol=${encodeURIComponent(symbol)}&period_type=${activePeriod}`);
    const result = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        showError(
          result.message || 'Sesión expirada en thesmartinvestortool.com',
          true // Activar botón para abrir modal de cookies
        );
      } else if (res.status === 404) {
        showError(`El símbolo "${symbol}" no fue encontrado o no tiene datos disponibles.`);
      } else {
        showError(result.message || 'Error al obtener estados financieros.');
      }
      return;
    }

    currentData = result.data;
    renderDashboard(currentData);
  } catch (err) {
    showError(`Error de conexión con el servidor local: ${err.message}`);
  } finally {
    loadingState.classList.add('hidden');
  }
}

// -----------------------------------------------------------------------------
// Dashboard Rendering
// -----------------------------------------------------------------------------
function renderDashboard(data) {
  // 1. Company Header
  companySymbol.textContent = data.symbol || 'N/A';
  companyName.textContent = data.company_name || data.symbol;
  companyPrice.textContent = data.price && data.price !== 'N/A' ? data.price : '';
  companySector.textContent = data.sector && data.sector !== 'N/A' ? data.sector : (data.industry || 'Finanzas');
  companyExchange.textContent = data.exchange && data.exchange !== 'N/A' ? data.exchange : 'Mercado';
  sourceLink.href = data.source_url || `https://thesmartinvestortool.com/metrics?symbol=${data.symbol}`;

  // 2. Render KPIs
  renderKPIs(data.kpis);

  // 3. Render Active Statement Table
  renderActiveTab();

  dashboardContent.classList.remove('hidden');
}

function renderKPIs(kpis) {
  kpiGrid.innerHTML = '';
  if (!kpis || Object.keys(kpis).length === 0) {
    kpiGrid.innerHTML = '<div class="col-span-full text-slate-500 text-sm italic">No hay métricas de resumen disponibles directamente para este ticker.</div>';
    return;
  }

  const entries = Object.entries(kpis);
  entries.forEach(([key, val]) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-900/90 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition flex flex-col justify-between shadow-sm';
    
    let valClass = 'text-white';
    const strVal = String(val);
    if (strVal.startsWith('+') || (strVal.includes('%') && !strVal.startsWith('-') && parseFloat(strVal) > 0)) {
      valClass = 'val-positive';
    } else if (strVal.startsWith('-')) {
      valClass = 'val-negative';
    }

    card.innerHTML = `
      <div class="text-xs font-medium text-slate-400 tracking-wide uppercase truncate mb-1" title="${key}">${key}</div>
      <div class="text-xl font-bold font-mono-num ${valClass} truncate">${val}</div>
    `;
    kpiGrid.appendChild(card);
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('bg-blue-600', 'text-white', 'shadow');
        t.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800');
      });
      tab.classList.add('bg-blue-600', 'text-white', 'shadow');
      tab.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800');

      activeTab = tab.dataset.tab;
      renderActiveTab();
    });
  });
}

function renderActiveTab() {
  if (!currentData) return;

  metricFilterInput.value = ''; // Limpiar filtro

  if (activeTab === 'json_viewer') {
    tableContainerWrapper.classList.add('hidden');
    jsonViewer.classList.remove('hidden');
    jsonCode.textContent = JSON.stringify(currentData, null, 2);
    tableTitle.textContent = 'Estructura JSON Completa';
    return;
  }

  const chartsBox = document.getElementById('chartsContainer');

  if (activeTab === 'charts') {
    tableContainerWrapper.classList.add('hidden');
    jsonViewer.classList.add('hidden');
    if (estimatesBox) estimatesBox.classList.add('hidden');
    if (chartsBox) chartsBox.classList.remove('hidden');

    const pType = currentData.period_type === 'quarterly' ? 'Trimestral' : 'Anual';
    tableTitle.textContent = `Gráficas Financieras — ${currentData.symbol || ''} (${pType})`;
    
    const subTitle = document.getElementById('chartsSubtitle');
    if (subTitle) subTitle.textContent = `— ${currentData.symbol || ''} (${pType})`;

    renderFinancialCharts();
    return;
  }

  if (chartsBox) chartsBox.classList.add('hidden');
  tableContainerWrapper.classList.remove('hidden');
  jsonViewer.classList.add('hidden');

  if (activeTab === 'estimates') {
    if (estimatesBox) {
      estimatesBox.classList.remove('hidden');
      renderEstimatesSummary(currentData.estimates ? currentData.estimates.summary : null);
    }
  } else {
    if (estimatesBox) {
      estimatesBox.classList.add('hidden');
    }
  }

  let tableData = currentData[activeTab];
  let defaultTitle = 'Estado Financiero';

  switch (activeTab) {
    case 'income_statement':
      defaultTitle = 'Estado de Resultados (Income Statement)';
      break;
    case 'balance_sheet':
      defaultTitle = 'Balance General (Balance Sheet)';
      break;
    case 'cash_flow':
      defaultTitle = 'Flujo de Caja (Cash Flow)';
      break;
    case 'ratios':
      defaultTitle = 'Ratios Financieros & Rentabilidad';
      break;
    case 'estimates':
      defaultTitle = 'Estimaciones & Proyecciones a 5 Años (Estimates)';
      break;
    case 'raw_tables':
      defaultTitle = 'Tablas Adicionales Encontradas';
      if (currentData.raw_tables && currentData.raw_tables.length > 0) {
        tableData = currentData.raw_tables[0];
      }
      break;
  }

  tableTitle.textContent = (tableData && tableData.title) ? tableData.title : defaultTitle;
  renderFinancialTable(tableData);
}

// -----------------------------------------------------------------------------
// Interactive Financial Charts (Chart.js)
// -----------------------------------------------------------------------------
let chartInstances = {
  revGp: null,
  yoy: null,
  margins: null,
  eps: null
};

function parseNum(val) {
  if (val === undefined || val === null || val === '—' || val === '-' || val === '') return null;
  const s = String(val).trim().replace(/,/g, '');
  if (s.endsWith('T')) return parseFloat(s.replace(/[\$T]/g, '')) * 1000;
  if (s.endsWith('B')) return parseFloat(s.replace(/[\$B]/g, ''));
  if (s.endsWith('M')) return parseFloat(s.replace(/[\$M]/g, '')) / 1000;
  if (s.endsWith('%')) return parseFloat(s.replace('%', ''));
  if (s.startsWith('$')) return parseFloat(s.replace('$', ''));
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function findMetricRow(rows, patterns) {
  if (!rows || !Array.isArray(rows)) return null;
  for (const pat of patterns) {
    const r = rows.find(row => {
      const m = (row.metric || '').toLowerCase().trim();
      return m === pat.toLowerCase() || m.startsWith(pat.toLowerCase());
    });
    if (r) return r;
  }
  return null;
}

function renderFinancialCharts() {
  if (!currentData || !window.Chart) return;

  const isData = currentData.income_statement || {};
  const isRows = isData.rows || [];
  const periods = isData.periods || [];

  if (periods.length === 0) return;

  // 1. Extraer Series de Datos
  const revRow = findMetricRow(isRows, ['revenues', 'company revenues', 'revenue', 'ingresos']);
  const gpRatioRow = findMetricRow(isRows, ['gross profit ratio', 'gross margin']);
  const gpRow = findMetricRow(isRows, ['gross profit', 'beneficio bruto']);
  const netIncRow = findMetricRow(isRows, ['net income', 'beneficio neto']);
  const netRatioRow = findMetricRow(isRows, ['net income ratio', 'net margin']);
  const epsRow = findMetricRow(isRows, ['diluted eps', 'basic eps', 'eps', 'diluted eps']);

  // Buscar filas YoY directas
  let yoyRevRow = null;
  let yoyNetIncRow = null;

  for (let i = 0; i < isRows.length; i++) {
    const m = (isRows[i].metric || '').toLowerCase();
    if ((m === 'revenues' || m === 'revenue') && i + 1 < isRows.length && isRows[i + 1].is_yoy) {
      yoyRevRow = isRows[i + 1];
    }
    if (m.includes('net income') && i + 1 < isRows.length && isRows[i + 1].is_yoy) {
      yoyNetIncRow = isRows[i + 1];
    }
  }

  // Parsear arrays numéricos
  const revValues = revRow ? revRow.values.map(parseNum) : [];
  
  let gpRatioValues = gpRatioRow ? gpRatioRow.values.map(parseNum) : [];
  if (gpRatioValues.length === 0 && gpRow && revRow) {
    // Calcular Gross Margin % = GP / Rev * 100
    const gpVals = gpRow.values.map(parseNum);
    gpRatioValues = revValues.map((r, i) => (r && gpVals[i]) ? (gpVals[i] / r) * 100 : null);
  }

  let yoyRevValues = yoyRevRow ? yoyRevRow.values.map(parseNum) : [];
  if (yoyRevValues.length === 0 && revValues.length > 0) {
    yoyRevValues = revValues.map((v, i) => (i > 0 && revValues[i - 1]) ? ((v - revValues[i - 1]) / Math.abs(revValues[i - 1])) * 100 : null);
  }

  const netIncValues = netIncRow ? netIncRow.values.map(parseNum) : [];
  let yoyNetIncValues = yoyNetIncRow ? yoyNetIncRow.values.map(parseNum) : [];
  if (yoyNetIncValues.length === 0 && netIncValues.length > 0) {
    yoyNetIncValues = netIncValues.map((v, i) => (i > 0 && netIncValues[i - 1]) ? ((v - netIncValues[i - 1]) / Math.abs(netIncValues[i - 1])) * 100 : null);
  }

  let netRatioValues = netRatioRow ? netRatioRow.values.map(parseNum) : [];
  if (netRatioValues.length === 0 && netIncRow && revRow) {
    netRatioValues = revValues.map((r, i) => (r && netIncValues[i]) ? (netIncValues[i] / r) * 100 : null);
  }

  const epsValues = epsRow ? epsRow.values.map(parseNum) : [];

  // Opciones de tema oscuro para Chart.js
  const darkGrid = { color: 'rgba(255, 255, 255, 0.07)', drawBorder: false };
  const tickStyle = { color: '#94a3b8', font: { family: 'Plus Jakarta Sans, sans-serif', size: 10 } };
  const tooltipDark = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    titleColor: '#ffffff',
    bodyColor: '#e2e8f0',
    borderColor: '#334155',
    borderWidth: 1,
    padding: 10,
    boxPadding: 4,
    cornerRadius: 8
  };

  // ---------------------------------------------------------------------------
  // GRÁFICA 1: Tendencia de Ingresos ($B) y Margen Bruto (%) — Doble Eje
  // ---------------------------------------------------------------------------
  const ctx1 = document.getElementById('chartRevenueGrossMargin');
  if (ctx1) {
    if (chartInstances.revGp) chartInstances.revGp.destroy();
    chartInstances.revGp = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: periods,
        datasets: [
          {
            label: 'Revenues ($B)',
            data: revValues,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            yAxisID: 'yLeft',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#3b82f6'
          },
          {
            label: 'Gross Profit Ratio (%)',
            data: gpRatioValues,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            borderDash: [5, 5],
            tension: 0.3,
            yAxisID: 'yRight',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#e2e8f0', font: { size: 11 } } },
          tooltip: {
            ...tooltipDark,
            callbacks: {
              label: function(ctx) {
                if (ctx.datasetIndex === 0) return ` Revenues: $${ctx.raw !== null ? ctx.raw.toFixed(2) : '—'}B`;
                return ` Gross Margin: ${ctx.raw !== null ? ctx.raw.toFixed(2) : '—'}%`;
              }
            }
          }
        },
        scales: {
          x: { grid: darkGrid, ticks: tickStyle },
          yLeft: {
            type: 'linear',
            position: 'left',
            grid: darkGrid,
            ticks: {
              ...tickStyle,
              callback: val => `$${val}B`
            },
            title: { display: true, text: 'Ingresos ($B)', color: '#3b82f6', font: { size: 11, weight: 'bold' } }
          },
          yRight: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              ...tickStyle,
              callback: val => `${val}%`
            },
            title: { display: true, text: 'Margen Bruto (%)', color: '#10b981', font: { size: 11, weight: 'bold' } }
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // GRÁFICA 2: Crecimiento YoY (Revenues vs Net Income) — Barras Agrupadas
  // ---------------------------------------------------------------------------
  const ctx2 = document.getElementById('chartYoYGrowth');
  if (ctx2) {
    if (chartInstances.yoy) chartInstances.yoy.destroy();
    chartInstances.yoy = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: periods,
        datasets: [
          {
            label: '% YoY Revenues',
            data: yoyRevValues,
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            categoryPercentage: 0.8,
            barPercentage: 0.9
          },
          {
            label: '% YoY Net Income',
            data: yoyNetIncValues,
            backgroundColor: '#10b981',
            borderRadius: 4,
            categoryPercentage: 0.8,
            barPercentage: 0.9
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#e2e8f0', font: { size: 11 } } },
          tooltip: {
            ...tooltipDark,
            callbacks: {
              label: function(ctx) {
                const prefix = ctx.raw > 0 ? '+' : '';
                return ` ${ctx.dataset.label}: ${ctx.raw !== null ? prefix + ctx.raw.toFixed(2) + '%' : '—'}`;
              }
            }
          }
        },
        scales: {
          x: { grid: darkGrid, ticks: tickStyle },
          y: {
            grid: darkGrid,
            ticks: {
              ...tickStyle,
              callback: val => `${val}%`
            },
            title: { display: true, text: 'Crecimiento YoY (%)', color: '#e2e8f0', font: { size: 11, weight: 'bold' } }
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // GRÁFICA 3: Márgenes de Rentabilidad (Bruto vs. Neto) — Escala 0% a 100%
  // ---------------------------------------------------------------------------
  const ctx3 = document.getElementById('chartMargins');
  if (ctx3) {
    if (chartInstances.margins) chartInstances.margins.destroy();
    chartInstances.margins = new Chart(ctx3, {
      type: 'line',
      data: {
        labels: periods,
        datasets: [
          {
            label: 'Gross Profit Ratio (%)',
            data: gpRatioValues,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.25,
            pointRadius: 4,
            pointBackgroundColor: '#38bdf8'
          },
          {
            label: 'Net Income Ratio (%)',
            data: netRatioValues,
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            borderDash: [4, 4],
            tension: 0.25,
            pointRadius: 4,
            pointBackgroundColor: '#f59e0b'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#e2e8f0', font: { size: 11 } } },
          tooltip: {
            ...tooltipDark,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.raw !== null ? ctx.raw.toFixed(2) + '%' : '—'}`
            }
          }
        },
        scales: {
          x: { grid: darkGrid, ticks: tickStyle },
          y: {
            min: 0,
            max: 100,
            grid: darkGrid,
            ticks: {
              ...tickStyle,
              stepSize: 20,
              callback: val => `${val}%`
            },
            title: { display: true, text: 'Margen (%)', color: '#e2e8f0', font: { size: 11, weight: 'bold' } }
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // GRÁFICA 4: Ganancias por Acción Básicas (Basic EPS) — Escala $
  // ---------------------------------------------------------------------------
  const ctx4 = document.getElementById('chartBasicEps');
  if (ctx4) {
    if (chartInstances.eps) chartInstances.eps.destroy();
    chartInstances.eps = new Chart(ctx4, {
      type: 'bar',
      data: {
        labels: periods,
        datasets: [
          {
            label: 'Basic EPS ($)',
            data: epsValues,
            backgroundColor: 'rgba(99, 102, 241, 0.85)',
            borderColor: '#6366f1',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#e2e8f0', font: { size: 11 } } },
          tooltip: {
            ...tooltipDark,
            callbacks: {
              label: ctx => ` Basic EPS: $${ctx.raw !== null ? ctx.raw.toFixed(2) : '—'}`
            }
          }
        },
        scales: {
          x: { grid: darkGrid, ticks: tickStyle },
          y: {
            grid: darkGrid,
            ticks: {
              ...tickStyle,
              callback: val => `$${val.toFixed(2)}`
            },
            title: { display: true, text: 'EPS ($)', color: '#6366f1', font: { size: 11, weight: 'bold' } }
          }
        }
      }
    });
  }
}

function renderEstimatesSummary(summary) {
  if (!summary) return;

  const dcfEl = document.getElementById('estDcfFv');
  const msFvEl = document.getElementById('estMsFv');
  const msRatEl = document.getElementById('estMsRating');
  const tsiEl = document.getElementById('estTsiRating');
  const tgtAvgEl = document.getElementById('estTargetAvg');
  const tgtRngEl = document.getElementById('estTargetRange');
  const totalRatEl = document.getElementById('analystTotalRatings');
  const pillsEl = document.getElementById('analystPills');

  if (dcfEl) dcfEl.textContent = summary.dcf_fair_value || '—';
  if (msFvEl) msFvEl.textContent = summary.morningstar_fair_value || '—';
  if (msRatEl) msRatEl.textContent = summary.morningstar_rating || '—';
  if (tsiEl) tsiEl.textContent = summary.tsi_rating || '—';
  if (tgtAvgEl) tgtAvgEl.textContent = summary.target_price_avg || '—';
  if (tgtRngEl) tgtRngEl.textContent = `${summary.target_price_low || '—'} / ${summary.target_price_high || '—'}`;

  const ratings = summary.analyst_ratings || {};
  if (totalRatEl) totalRatEl.textContent = `${ratings.total || 0} analistas`;

  if (pillsEl) {
    pillsEl.innerHTML = `
      <span class="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold font-mono-num">
        Strong Buy: ${ratings.strong_buy || 0}
      </span>
      <span class="px-2.5 py-1 rounded-md bg-green-950 text-green-300 border border-green-800 font-semibold font-mono-num">
        Buy: ${ratings.buy || 0}
      </span>
      <span class="px-2.5 py-1 rounded-md bg-amber-950 text-amber-300 border border-amber-800 font-semibold font-mono-num">
        Hold: ${ratings.hold || 0}
      </span>
      <span class="px-2.5 py-1 rounded-md bg-rose-950 text-rose-300 border border-rose-800 font-semibold font-mono-num">
        Sell: ${ratings.sell || 0}
      </span>
      <span class="px-2.5 py-1 rounded-md bg-red-950 text-red-300 border border-red-800 font-semibold font-mono-num">
        Strong Sell: ${ratings.strong_sell || 0}
      </span>
    `;
  }
}

function renderFinancialTable(tableData) {
  tableHeaderRow.innerHTML = '';
  tableBody.innerHTML = '';

  if (!tableData || !tableData.rows || tableData.rows.length === 0) {
    tableHeaderRow.innerHTML = '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-300">Métrica</th>';
    tableBody.innerHTML = `
      <tr>
        <td class="px-4 py-8 text-center text-slate-500 italic" colspan="5">
          No se encontraron datos estructurados para esta sección.
        </td>
      </tr>
    `;
    return;
  }

  // 1. Header (Sticky Metric + Periods)
  const metricTh = document.createElement('th');
  metricTh.className = 'sticky-col px-5 py-3.5 text-left text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[240px] border-b border-slate-700 bg-slate-800';
  metricTh.textContent = 'Métrica / Concepto';
  tableHeaderRow.appendChild(metricTh);

  const periods = tableData.periods || [];
  periods.forEach(p => {
    const th = document.createElement('th');
    th.className = 'px-5 py-3.5 text-right text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[120px] border-b border-slate-700 font-mono-num';
    th.textContent = p;
    tableHeaderRow.appendChild(th);
  });

  // 2. Rows
  tableData.rows.forEach(row => {
    const isYoY = row.is_yoy || row.metric.toLowerCase().includes('% change yoy') || row.metric.toLowerCase() === 'growth';
    const tr = document.createElement('tr');

    if (isYoY) {
      tr.className = 'border-b border-slate-800/40 bg-slate-950/50 hover:bg-slate-900/60 transition-colors group text-xs';
    } else {
      tr.className = 'border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors group font-medium';
    }

    // Sticky Metric Name TD
    const metricTd = document.createElement('td');
    if (isYoY) {
      metricTd.className = 'sticky-col pl-9 pr-5 py-2 text-xs font-normal text-slate-400 group-hover:text-slate-300 transition min-w-[240px] flex items-center gap-1.5';
      metricTd.innerHTML = `<span class="text-slate-600 select-none">↳</span> <span class="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono text-[10px] border border-slate-700/60">% Change YoY</span>`;
    } else {
      metricTd.className = 'sticky-col px-5 py-3 text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition min-w-[240px]';
      metricTd.textContent = row.metric;
    }
    tr.appendChild(metricTd);

    // Value TDs
    const values = row.values || [];
    const maxCols = Math.max(periods.length, values.length);

    for (let i = 0; i < maxCols; i++) {
      const td = document.createElement('td');
      const val = values[i] !== undefined ? String(values[i]) : '—';

      let valClass = 'text-slate-300';

      if (isYoY || val.includes('%')) {
        const cleanVal = val.replace('%', '').trim();
        const numVal = parseFloat(cleanVal);
        if (!isNaN(numVal)) {
          if (numVal > 0) {
            valClass = 'text-emerald-400 font-semibold';
          } else if (numVal < 0) {
            valClass = 'text-rose-400 font-semibold';
          } else {
            valClass = 'text-slate-500';
          }
        } else if (val.startsWith('+')) {
          valClass = 'text-emerald-400 font-semibold';
        } else if (val.startsWith('-')) {
          valClass = 'text-rose-400 font-semibold';
        } else {
          valClass = 'text-slate-500';
        }
      } else {
        if (val.startsWith('-') || (val.startsWith('(') && val.endsWith(')'))) {
          valClass = 'val-negative';
        } else if (val === '—' || val === '-') {
          valClass = 'text-slate-600';
        } else {
          valClass = 'val-neutral';
        }
      }

      const pyClass = isYoY ? 'py-2 text-xs' : 'py-3 text-sm';
      td.className = `px-5 ${pyClass} text-right font-mono-num ${valClass} whitespace-nowrap`;
      td.textContent = val;
      tr.appendChild(td);
    }

    tableBody.appendChild(tr);
  });
}

function filterTableRows(query) {
  const filter = query.toLowerCase().trim();
  const rows = tableBody.querySelectorAll('tr');

  rows.forEach(row => {
    const metricCell = row.querySelector('td.sticky-col');
    if (!metricCell) return;
    const text = metricCell.textContent.toLowerCase();
    if (text.includes(filter)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// -----------------------------------------------------------------------------
// Export Features
// -----------------------------------------------------------------------------
function exportToCSV() {
  if (!currentData || !currentData[activeTab]) {
    alert('No hay datos en la pestaña actual para exportar.');
    return;
  }

  const tableData = currentData[activeTab];
  if (!tableData.rows || tableData.rows.length === 0) {
    alert('La tabla está vacía.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Header row
  const headers = ['Métrica', ...(tableData.periods || [])];
  csvContent += headers.map(h => `"${h}"`).join(',') + '\r\n';

  // Data rows
  tableData.rows.forEach(r => {
    const rowArray = [r.metric, ...(r.values || [])];
    csvContent += rowArray.map(val => `"${val}"`).join(',') + '\r\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${currentData.symbol}_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function copyJSONToClipboard() {
  if (!currentData) return;
  navigator.clipboard.writeText(JSON.stringify(currentData, null, 2)).then(() => {
    const btn = document.getElementById('copyJsonBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg class="w-4 h-4 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> ¡Copiado!`;
    setTimeout(() => {
      btn.innerHTML = originalText;
    }, 2000);
  });
}

// -----------------------------------------------------------------------------
// Error & Notification Handling
// -----------------------------------------------------------------------------
function showError(msg, isAuthError = false) {
  errorMessage.innerHTML = `
    <div class="flex items-start gap-3">
      <span class="text-xl">⚠️</span>
      <div>
        <p class="font-semibold text-rose-300">${msg}</p>
        ${isAuthError ? `
          <p class="text-xs text-rose-200/80 mt-1">
            Se requiere una cookie de sesión válida para acceder a thesmartinvestortool.com.
          </p>
          <button onclick="openCookieModal()" class="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition">
            Configurar Cookies Ahora
          </button>
        ` : ''}
      </div>
    </div>
  `;
  errorAlert.classList.remove('hidden');
}

function hideError() {
  errorAlert.classList.add('hidden');
}

// -----------------------------------------------------------------------------
// Cookie Modal Management
// -----------------------------------------------------------------------------
function openCookieModal() {
  cookieModal.classList.remove('hidden');
  cookieFeedback.classList.add('hidden');
  cookieInput.focus();
}

function closeCookieModal() {
  cookieModal.classList.add('hidden');
}

async function handleSaveCookie() {
  const val = cookieInput.value.trim();
  if (!val) {
    cookieFeedback.className = 'text-xs text-rose-400 mt-2 block';
    cookieFeedback.textContent = 'Por favor pega una cadena de cookie válida.';
    cookieFeedback.classList.remove('hidden');
    return;
  }

  cookieSaveBtn.disabled = true;
  cookieSaveBtn.textContent = 'Guardando...';

  try {
    const res = await fetch('/api/settings/cookies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie_string: val })
    });
    const data = await res.json();

    if (res.ok) {
      cookieFeedback.className = 'text-xs text-emerald-400 mt-2 block';
      cookieFeedback.textContent = `¡Cookies guardadas! Se procesaron ${data.cookies_parsed_count} valores de sesión.`;
      cookieFeedback.classList.remove('hidden');
      await checkCookieStatus();
      setTimeout(() => {
        closeCookieModal();
        if (lastSearchedTicker) {
          searchTicker(lastSearchedTicker);
        }
      }, 1200);
    } else {
      cookieFeedback.className = 'text-xs text-rose-400 mt-2 block';
      cookieFeedback.textContent = data.detail || 'Error al guardar cookie.';
      cookieFeedback.classList.remove('hidden');
    }
  } catch (err) {
    cookieFeedback.className = 'text-xs text-rose-400 mt-2 block';
    cookieFeedback.textContent = `Error: ${err.message}`;
    cookieFeedback.classList.remove('hidden');
  } finally {
    cookieSaveBtn.disabled = false;
    cookieSaveBtn.textContent = 'Guardar y Aplicar';
  }
}
