import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { fetchWatchlistLiveQuotes, LiveWatchlistQuote } from './apiService';

const DEMO_WATCHLIST_KEY = '@smart_investor_demo_watchlist';

export interface WatchlistItem {
  id?: string;
  user_id: string;
  symbol: string;
  company_name?: string;
  created_at?: string;
  // Métricas en memoria para cotizaciones en vivo
  price?: number;
  change?: number;
  change_percent?: number;
  fair_value?: number;
  forward_pe?: number;
}

// Memoria de sesión para cotizaciones en vivo (evita saturar peticiones al cambiar de pestañas)
const sessionQuotesCache = new Map<string, LiveWatchlistQuote>();

export function getCachedQuote(symbol: string): LiveWatchlistQuote | undefined {
  return sessionQuotesCache.get(symbol.toUpperCase().trim());
}

export function setCachedQuotes(quotes: LiveWatchlistQuote[]) {
  for (const q of quotes) {
    if (q.price > 0 || q.status === 'success') {
      sessionQuotesCache.set(q.symbol.toUpperCase().trim(), q);
    }
  }
}

/**
 * Consulta la lista de activos en seguimiento del usuario desde Supabase o AsyncStorage.
 * No guarda precios en la base de datos para mantener el esquema limpio y desacoplado.
 */
export async function fetchUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  try {
    let rawItems: WatchlistItem[] = [];

    if (!userId || userId.startsWith('demo')) {
      const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
      rawItems = stored ? (JSON.parse(stored) as WatchlistItem[]) : [];
    } else {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('id, user_id, symbol, company_name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase watchlist fetch warning, trying local storage:', error.message);
        const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
        rawItems = stored ? JSON.parse(stored) : [];
      } else {
        rawItems = (data as WatchlistItem[]) || [];
      }
    }

    // Adjuntar cotizaciones en caché de sesión si ya existen
    return rawItems.map((item) => {
      const cached = sessionQuotesCache.get(item.symbol.toUpperCase().trim());
      if (cached) {
        return {
          ...item,
          company_name: cached.company_name || item.company_name,
          price: cached.price,
          change: cached.change,
          change_percent: cached.change_percent,
          fair_value: cached.fair_value,
          forward_pe: cached.forward_pe,
        };
      }
      return item;
    });
  } catch (err) {
    console.warn('Exception in fetchUserWatchlist:', err);
    return [];
  }
}

/**
 * Consulta y actualiza en tiempo real las cotizaciones de la Watchlist a petición del usuario (On Demand).
 */
export async function refreshLiveMarketQuotes(currentItems: WatchlistItem[]): Promise<{
  updatedItems: WatchlistItem[];
  successCount: number;
}> {
  if (!currentItems || currentItems.length === 0) {
    return { updatedItems: [], successCount: 0 };
  }

  const symbols = currentItems.map((i) => i.symbol);

  try {
    const liveQuotes = await fetchWatchlistLiveQuotes(symbols);
    if (!liveQuotes || liveQuotes.length === 0) {
      return { updatedItems: currentItems, successCount: 0 };
    }

    setCachedQuotes(liveQuotes);

    let successCount = 0;
    const updatedItems = currentItems.map((item) => {
      const live = sessionQuotesCache.get(item.symbol.toUpperCase().trim());
      if (!live) return { ...item };

      if (live.price > 0) successCount++;

      return {
        ...item,
        company_name: live.company_name || item.company_name,
        price: live.price > 0 ? Number(live.price) : item.price,
        change: live.change !== 0 ? Number(live.change) : item.change,
        change_percent:
          live.change_percent !== 0 ? Number(live.change_percent) : item.change_percent,
        fair_value: live.fair_value > 0 ? Number(live.fair_value) : item.fair_value,
        forward_pe: live.forward_pe > 0 ? Number(live.forward_pe) : item.forward_pe,
      };
    });

    return { updatedItems, successCount };
  } catch (err) {
    console.warn('Error in refreshLiveMarketQuotes:', err);
    return { updatedItems: currentItems, successCount: 0 };
  }
}

export async function isStockInWatchlist(userId: string, symbol: string): Promise<boolean> {
  try {
    if (!userId || userId.startsWith('demo')) {
      const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
      if (!stored) return false;
      const list = JSON.parse(stored) as WatchlistItem[];
      return list.some((i) => i.symbol.toUpperCase() === symbol.toUpperCase());
    }

    const { data, error } = await supabase
      .from('user_watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase())
      .limit(1);

    if (error || !data) {
      const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
      if (!stored) return false;
      const list = JSON.parse(stored) as WatchlistItem[];
      return list.some((i) => i.symbol.toUpperCase() === symbol.toUpperCase());
    }

    return data.length > 0;
  } catch {
    return false;
  }
}

export async function addToWatchlist(item: {
  user_id: string;
  symbol: string;
  company_name?: string;
}): Promise<{ success: boolean; error?: string }> {
  const cleanSymbol = item.symbol.trim().toUpperCase();

  try {
    // Guardar en local storage (redundancia offline / demo)
    try {
      const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
      const list: WatchlistItem[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((i) => i.symbol.toUpperCase() !== cleanSymbol);
      filtered.unshift({
        user_id: item.user_id,
        symbol: cleanSymbol,
        company_name: item.company_name || cleanSymbol,
        created_at: new Date().toISOString(),
      });
      await AsyncStorage.setItem(DEMO_WATCHLIST_KEY, JSON.stringify(filtered));
    } catch {}

    // Guardar en Supabase sin campos de precio estáticos
    if (item.user_id && !item.user_id.startsWith('demo')) {
      const { error } = await supabase.from('user_watchlist').upsert(
        {
          user_id: item.user_id,
          symbol: cleanSymbol,
          company_name: item.company_name || cleanSymbol,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,symbol' }
      );

      if (error) {
        console.warn('Supabase upsert warning:', error.message);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function removeFromWatchlist(userId: string, symbol: string): Promise<{ success: boolean; error?: string }> {
  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    // Eliminar de local storage
    try {
      const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
      if (stored) {
        const list: WatchlistItem[] = JSON.parse(stored);
        const filtered = list.filter((i) => i.symbol.toUpperCase() !== cleanSymbol);
        await AsyncStorage.setItem(DEMO_WATCHLIST_KEY, JSON.stringify(filtered));
      }
    } catch {}

    // Eliminar de Supabase
    if (userId && !userId.startsWith('demo')) {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('symbol', cleanSymbol);

      if (error) {
        console.warn('Supabase delete warning:', error.message);
      }
    }

    // Limpiar de la caché de sesión
    sessionQuotesCache.delete(cleanSymbol);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}
