import { supabase } from './supabaseClient';

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
