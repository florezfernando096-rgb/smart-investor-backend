import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  WatchlistItem,
  fetchUserWatchlist,
  removeFromWatchlist,
} from '../services/watchlistService';

interface Props {
  onSelectStock: (symbol: string) => void;
  onNavigateToSearch: () => void;
}

export const WatchlistScreen: React.FC<Props> = ({
  onSelectStock,
  onNavigateToSearch,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWatchlist = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchUserWatchlist(user.id);
      setItems(data);
    } catch (err) {
      console.warn('Error loading watchlist:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWatchlist();
  };

  const handleRemove = async (symbol: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Eliminar de Watchlist',
      `¿Deseas quitar ${symbol} de tu lista de seguimiento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            // Optimistic update
            setItems((prev) => prev.filter((i) => i.symbol !== symbol));
            await removeFromWatchlist(user.id, symbol);
          },
        },
      ]
    );
  };

  return (
    <View style={{ backgroundColor: colors.bg }} className="flex-1 px-4 pt-3">
      {/* Cabecera de la Pantalla */}
      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text style={{ color: colors.textPrimary }} className="text-xl font-black tracking-tight">
            📌 Mi Watchlist
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-xs">
            {items.length} {items.length === 1 ? 'acción en seguimiento' : 'acciones en seguimiento'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          style={{
            backgroundColor: colors.pillBg,
            borderColor: colors.pillBorder,
          }}
          className="px-3 py-1.5 rounded-xl border flex-row items-center active:opacity-70"
        >
          <Text style={{ color: colors.textPrimary }} className="text-xs font-bold mr-1">
            🔄
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">
            Actualizar
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.chartPrimary} />
          <Text style={{ color: colors.textSecondary }} className="text-xs mt-2">
            Cargando lista de seguimiento...
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          }}
          className="rounded-3xl p-8 border items-center justify-center my-8 text-center"
        >
          <Text className="text-4xl mb-3">⭐</Text>
          <Text
            style={{ color: colors.textPrimary }}
            className="text-base font-black text-center mb-1.5"
          >
            Tu Watchlist está vacía
          </Text>
          <Text
            style={{ color: colors.textSecondary }}
            className="text-xs text-center mb-6 leading-5"
          >
            Busca cualquier acción en el analizador y presiona "★ Agregar a Watchlist" para seguirla en tiempo real.
          </Text>
          <TouchableOpacity
            onPress={onNavigateToSearch}
            className="bg-indigo-600 px-6 py-3 rounded-2xl shadow-lg active:bg-indigo-700"
          >
            <Text className="text-white text-xs font-extrabold tracking-wide">
              🔍 Explorar Acciones
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.chartPrimary}
              colors={[colors.chartPrimary]}
            />
          }
          className="flex-1"
        >
          {items.map((item, idx) => {
            const price = Number(item.price) || 0;
            const changePct = Number(item.change_percent) || 0;
            const isPos = changePct >= 0;
            const fairVal = Number(item.fair_value) || 0;
            const fwdPe = Number(item.forward_pe) || 0;

            return (
              <TouchableOpacity
                key={`wl-${item.symbol}-${idx}`}
                onPress={() => onSelectStock(item.symbol)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.shadowColor,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.3 : 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
                className="rounded-2xl p-4 mb-3 border"
              >
                {/* Fila 1: Ticker, Empresa y Botón Eliminar */}
                <View className="flex-row justify-between items-start mb-2.5">
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center">
                      <View className="bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/30 mr-2">
                        <Text className="text-indigo-600 dark:text-indigo-300 font-black text-sm font-mono">
                          {item.symbol}
                        </Text>
                      </View>
                      <Text
                        style={{ color: colors.textPrimary }}
                        className="text-sm font-bold flex-1"
                        numberOfLines={1}
                      >
                        {item.company_name || item.symbol}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemove(item.symbol)}
                    className="p-1.5 rounded-lg active:bg-rose-500/20"
                  >
                    <Text className="text-slate-400 text-xs">🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* Fila 2: Grid de Métricas Clave */}
                <View
                  style={{
                    backgroundColor: colors.cardBgSubtle,
                    borderColor: colors.gridLine,
                  }}
                  className="rounded-xl p-2.5 flex-row justify-between items-center border"
                >
                  {/* Precio */}
                  <View className="items-center flex-1">
                    <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold uppercase mb-0.5">
                      Precio
                    </Text>
                    <Text style={{ color: colors.textPrimary }} className="text-xs font-black">
                      ${price.toFixed(2)}
                    </Text>
                  </View>

                  {/* Variación */}
                  <View className="items-center flex-1">
                    <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold uppercase mb-0.5">
                      Var. 24h
                    </Text>
                    <Text
                      style={{ color: isPos ? colors.positive : colors.negative }}
                      className="text-xs font-extrabold"
                    >
                      {isPos ? '+' : ''}
                      {changePct.toFixed(2)}%
                    </Text>
                  </View>

                  {/* Fair Value */}
                  <View className="items-center flex-1">
                    <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold uppercase mb-0.5">
                      Fair Value
                    </Text>
                    <Text style={{ color: colors.positive }} className="text-xs font-black">
                      {fairVal > 0 ? `$${fairVal.toFixed(2)}` : '—'}
                    </Text>
                  </View>

                  {/* Forward P/E */}
                  <View className="items-center flex-1">
                    <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold uppercase mb-0.5">
                      Fwd P/E
                    </Text>
                    <Text style={{ color: colors.chartPrimary }} className="text-xs font-bold">
                      {fwdPe > 0 ? `${fwdPe.toFixed(1)}x` : '—'}
                    </Text>
                  </View>
                </View>

                {/* Footer de Tarjeta con Call to Action */}
                <View className="flex-row justify-end items-center mt-2">
                  <Text style={{ color: colors.textMuted }} className="text-[10px] mr-1">
                    Toca para analizar
                  </Text>
                  <Text style={{ color: colors.textMuted }} className="text-[10px]">
                    ➔
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View className="h-10" />
        </ScrollView>
      )}
    </View>
  );
};
