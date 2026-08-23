/**
 * Servicio de Búsqueda y Autocompletado Instantáneo de Tickers Bursátiles
 * Utiliza una arquitectura Híbrida:
 * 1. Base de datos local precargada (91,000+ empresas) -> Búsqueda inmediata (0ms) offline.
 * 2. Actualización asíncrona en segundo plano desde https://thesmartinvestortool.com/static/stock_symbols.json.
 */

import rawSymbols from '../data/stock_symbols.json';

export interface StockSymbolItem {
  symbol: string;
  name: string;
}

interface ParsedItem {
  s: string; // symbol
  n: string; // name
  sUpper: string;
  nUpper: string;
}

let symbolsCache: ParsedItem[] = [];

function initIndex() {
  if (symbolsCache.length > 0) return;

  const rawList: string[] = Array.isArray(rawSymbols) ? (rawSymbols as string[]) : [];
  symbolsCache = rawList.map((item: string) => {
    const idx = item.indexOf(' - ');
    const s = idx === -1 ? item.trim() : item.slice(0, idx).trim();
    const n = idx === -1 ? s : item.slice(idx + 3).trim();
    return {
      s,
      n,
      sUpper: s.toUpperCase(),
      nUpper: n.toUpperCase(),
    };
  });
}

// Inicializar índice en memoria
initIndex();

/**
 * Búsqueda inteligente con priorización por relevancia:
 * 1. Coincidencia exacta de Ticker (ej. MSFT -> Microsoft)
 * 2. Prefijo de Ticker sin punto (US: NASDAQ/NYSE)
 * 3. Prefijo de Ticker global
 * 4. Coincidencia en el nombre de la empresa
 */
export function searchStockSymbols(query: string, limit: number = 8): StockSymbolItem[] {
  if (!query || query.trim().length === 0) return [];
  initIndex();

  const q = query.trim().toUpperCase();
  const exact: StockSymbolItem[] = [];
  const prefixUS: StockSymbolItem[] = [];
  const prefixGlobal: StockSymbolItem[] = [];
  const nameMatches: StockSymbolItem[] = [];

  for (let i = 0; i < symbolsCache.length; i++) {
    const item = symbolsCache[i];
    const { s, n, sUpper, nUpper } = item;

    if (sUpper === q) {
      exact.push({ symbol: s, name: n });
    } else if (sUpper.startsWith(q)) {
      if (!sUpper.includes('.')) {
        prefixUS.push({ symbol: s, name: n });
      } else {
        prefixGlobal.push({ symbol: s, name: n });
      }
    } else if (nUpper.includes(q)) {
      nameMatches.push({ symbol: s, name: n });
    }

    // Cortar anticipadamente si ya encontramos suficientes coincidencias prioritarias
    if (exact.length + prefixUS.length >= limit * 2) break;
  }

  const merged = [...exact, ...prefixUS, ...prefixGlobal, ...nameMatches];
  // Eliminar duplicados si los hubiera
  const seen = new Set<string>();
  const results: StockSymbolItem[] = [];

  for (const item of merged) {
    if (!seen.has(item.symbol)) {
      seen.add(item.symbol);
      results.push(item);
      if (results.length >= limit) break;
    }
  }

  return results;
}

/**
 * Actualiza el catálogo de símbolos en segundo plano desde la web de origen
 */
export async function syncSymbolsInBackground() {
  try {
    const response = await fetch('https://thesmartinvestortool.com/static/stock_symbols.json');
    if (response.ok) {
      const freshList: string[] = await response.json();
      if (Array.isArray(freshList) && freshList.length > 50000) {
        symbolsCache = freshList.map((item: string) => {
          const idx = item.indexOf(' - ');
          const s = idx === -1 ? item.trim() : item.slice(0, idx).trim();
          const n = idx === -1 ? s : item.slice(idx + 3).trim();
          return {
            s,
            n,
            sUpper: s.toUpperCase(),
            nUpper: n.toUpperCase(),
          };
        });
      }
    }
  } catch {
    // Si no hay internet, se mantiene la base de datos local
  }
}
