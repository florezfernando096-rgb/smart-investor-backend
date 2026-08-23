import { supabase } from './supabaseClient';

export interface StockAlert {
  id?: string;
  user_id: string;
  symbol: string;
  condition_type: 'price_above' | 'price_below' | 'change_pct_above' | 'change_pct_below';
  target_price?: number | null;
  target_change_percent?: number | null;
  notes?: string | null;
  status: 'active' | 'triggered' | 'disabled';
  created_at?: string;
}

export async function fetchStockAlerts(userId: string, symbol?: string): Promise<StockAlert[]> {
  try {
    let query = supabase
      .from('alertas')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching alertas from Supabase:', error.message);
      return [];
    }

    return (data as StockAlert[]) || [];
  } catch (err) {
    console.warn('Exception in fetchStockAlerts:', err);
    return [];
  }
}

export async function createStockAlert(alert: Omit<StockAlert, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('alertas').insert([
      {
        user_id: alert.user_id,
        symbol: alert.symbol.toUpperCase(),
        condition_type: alert.condition_type,
        target_price: alert.target_price || null,
        target_change_percent: alert.target_change_percent || null,
        notes: alert.notes || '',
        status: alert.status || 'active',
      },
    ]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error guardando alerta' };
  }
}

export async function deleteStockAlert(alertId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('alertas')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error eliminando alerta' };
  }
}
