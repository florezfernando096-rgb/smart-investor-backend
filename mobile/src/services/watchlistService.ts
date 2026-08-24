import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { fetchWatchlistLiveQuotes } from './apiService';

const DEMO_WATCHLIST_KEY = '@smart_investor_demo_watchlist';

export interface WatchlistItem {
  id?: string;
  user_id: string;
  symbol: string;
  company_name?: string;
  price?: number;
  change?: number;
  change_percent?: number;
  fair_value?: number;
  forward_pe?: number;
  created_at?: string;
}

export async function fetchUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  try {
    if (!userId || userId.startsWith('demo')) {
      const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
      if (stored) {
        return JSON.parse(stored) as WatchlistItem[];
      }
      return [];
    }

    const { data, error } = await supabase
      .from('user_watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase watchlist fetch warning, trying local storage:', error.message);
      const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    }

    return (data as WatchlistItem[]) || [];
  } catch (err) {
    console.warn('Exception in fetchUserWatchlist:', err);
    try {
      const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Sincroniza en tiempo real las cotizaciones de la Watchlist consultando los precios en vivo del mercado
 * y actualizando la base de datos de Supabase / AsyncStorage.
 */
export async function syncWatchlistWithLiveMarket(
  userId: string,
  currentItems: WatchlistItem[]
): Promise<WatchlistItem[]> {
  if (!currentItems || currentItems.length === 0) return [];

  const symbols = currentItems.map((i) => i.symbol);

  try {
    const liveQuotes = await fetchWatchlistLiveQuotes(symbols);
    if (!liveQuotes || liveQuotes.length === 0) return currentItems;

    const quoteMap = new Map<string, typeof liveQuotes[0]>();
    for (const q of liveQuotes) {
      if (q.price > 0 || q.status === 'success') {
        quoteMap.set(q.symbol.toUpperCase().trim(), q);
      }
    }

    const updatedItems: WatchlistItem[] = currentItems.map((item) => {
      const live = quoteMap.get(item.symbol.toUpperCase().trim());
      if (!live) return { ...item };

      return {
        ...item,
        company_name: live.company_name || item.company_name,
        price: live.price > 0 ? Number(live.price) : Number(item.price) || 0,
        change: live.change !== 0 ? Number(live.change) : Number(item.change) || 0,
        change_percent:
          live.change_percent !== 0
            ? Number(live.change_percent)
            : Number(item.change_percent) || 0,
        fair_value: live.fair_value > 0 ? Number(live.fair_value) : Number(item.fair_value) || 0,
        forward_pe: live.forward_pe > 0 ? Number(live.forward_pe) : Number(item.forward_pe) || 0,
      };
    });

    // Guardar en AsyncStorage para redundancia instantánea
    AsyncStorage.setItem(DEMO_WATCHLIST_KEY, JSON.stringify(updatedItems)).catch(() => {});

    // Actualizar Supabase si el usuario está autenticado
    if (userId && !userId.startsWith('demo')) {
      Promise.all(
        updatedItems.map((item) =>
          supabase.from('user_watchlist').upsert(
            {
              user_id: userId,
              symbol: item.symbol.toUpperCase(),
              company_name: item.company_name,
              price: item.price,
              change: item.change,
              change_percent: item.change_percent,
              fair_value: item.fair_value,
              forward_pe: item.forward_pe,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,symbol' }
          )
        )
      ).catch((err) => console.warn('Background Supabase watchlist sync error:', err));
    }

    return updatedItems;
  } catch (err) {
    console.warn('Error in syncWatchlistWithLiveMarket:', err);
    return currentItems;
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

export async function addToWatchlist(item: WatchlistItem): Promise<{ success: boolean; error?: string }> {
  try {
    // Guardar en local storage
    try {
      const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
      const list: WatchlistItem[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((i) => i.symbol.toUpperCase() !== item.symbol.toUpperCase());
      filtered.unshift(item);
      await AsyncStorage.setItem(DEMO_WATCHLIST_KEY, JSON.stringify(filtered));
    } catch {}

    if (item.user_id && !item.user_id.startsWith('demo')) {
      const { error } = await supabase.from('user_watchlist').upsert(
        {
          user_id: item.user_id,
          symbol: item.symbol.toUpperCase(),
          company_name: item.company_name,
          price: item.price,
          change: item.change,
          change_percent: item.change_percent,
          fair_value: item.fair_value,
          forward_pe: item.forward_pe,
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
  try {
    // Eliminar de local storage
    try {
      const stored = await AsyncStorage.getItem(DEMO_WATCHLIST_KEY);
      if (stored) {
        const list: WatchlistItem[] = JSON.parse(stored);
        const filtered = list.filter((i) => i.symbol.toUpperCase() !== symbol.toUpperCase());
        await AsyncStorage.setItem(DEMO_WATCHLIST_KEY, JSON.stringify(filtered));
      }
    } catch {}

    if (userId && !userId.startsWith('demo')) {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('symbol', symbol.toUpperCase());

      if (error) {
        console.warn('Supabase delete warning:', error.message);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}
