import { supabase } from './supabaseClient';
import { fetchWatchlistLiveQuotes } from './apiService';

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
    const { data, error } = await supabase
      .from('user_watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user_watchlist from Supabase:', error.message);
      return [];
    }

    return (data as WatchlistItem[]) || [];
  } catch (err) {
    console.warn('Exception in fetchUserWatchlist:', err);
    return [];
  }
}

/**
 * Sincroniza en tiempo real las cotizaciones de la Watchlist consultando los precios en vivo del mercado
 * y actualizando la base de datos de Supabase en segundo plano.
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
        quoteMap.set(q.symbol.toUpperCase(), q);
      }
    }

    const updatedItems = currentItems.map((item) => {
      const live = quoteMap.get(item.symbol.toUpperCase());
      if (!live) return item;

      return {
        ...item,
        company_name: live.company_name || item.company_name,
        price: live.price > 0 ? live.price : item.price,
        change: live.change !== 0 ? live.change : item.change,
        change_percent: live.change_percent !== 0 ? live.change_percent : item.change_percent,
        fair_value: live.fair_value > 0 ? live.fair_value : item.fair_value,
        forward_pe: live.forward_pe > 0 ? live.forward_pe : item.forward_pe,
      };
    });

    // Actualizar Supabase en segundo plano de forma asíncrona
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

    return updatedItems;
  } catch (err) {
    console.warn('Error in syncWatchlistWithLiveMarket:', err);
    return currentItems;
  }
}

export async function isStockInWatchlist(userId: string, symbol: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase())
      .limit(1);

    if (error || !data) return false;
    return data.length > 0;
  } catch {
    return false;
  }
}

export async function addToWatchlist(item: WatchlistItem): Promise<{ success: boolean; error?: string }> {
  try {
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
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function removeFromWatchlist(userId: string, symbol: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase());

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}
