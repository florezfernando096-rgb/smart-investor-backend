import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  WatchlistItem,
  fetchUserWatchlist,
  removeFromWatchlist,
} from '../services/watchlistService';
import { fetchStockAlerts, StockAlert } from '../services/alertService';
import { AlertModal } from '../components/AlertModal';

interface Props {
  onSelectStock: (symbol: string) => void;
  onNavigateToSearch: () => void;
}

const TICKER_COL_WIDTH = 120;
const COL_WIDTH = 92;
const ROW_HEIGHT = 58;
const HEADER_HEIGHT = 38;

export const WatchlistScreen: React.FC<Props> = ({
  onSelectStock,
  onNavigateToSearch,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estado para el modal de alerta
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [selectedStockForAlert, setSelectedStockForAlert] = useState<{
    symbol: string;
    companyName?: string;
    price: number;
  } | null>(null);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const [wlData, alertsData] = await Promise.all([
        fetchUserWatchlist(user.id),
        fetchStockAlerts(user.id),
      ]);
      setItems(wlData);
      setAlerts(alertsData);
    } catch (err) {
      console.warn('Error loading watchlist data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenAlert = (item: WatchlistItem) => {
    setSelectedStockForAlert({
      symbol: item.symbol,
      companyName: item.company_name,
      price: Number(item.price) || 0,
    });
    setAlertModalVisible(true);
  };

  const handleRemove = (symbol: string) => {
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
            setItems((prev) => prev.filter((i) => i.symbol !== symbol));
            await removeFromWatchlist(user.id, symbol);
          },
        },
      ]
    );
  };

  const filteredItems = items.filter((item) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toUpperCase();
    return (
      item.symbol.toUpperCase().includes(q) ||
      (item.company_name && item.company_name.toUpperCase().includes(q))
    );
  });

  const getAlertCountForSymbol = (sym: string): number => {
    return alerts.filter((a) => a.symbol.toUpperCase() === sym.toUpperCase()).length;
  };

  return (
    <View style={{ backgroundColor: colors.bg }} className="flex-1 px-3 pt-2">
      {/* Cabecera Principal */}
      <View className="flex-row justify-between items-center mb-2 px-1">
        <View>
          <Text style={{ color: colors.textPrimary }} className="text-xl font-black tracking-tight">
            📌 Mi Watchlist
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-[11px]">
            {items.length} {items.length === 1 ? 'activo en seguimiento' : 'activos en seguimiento'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          style={{
            backgroundColor: colors.pillBg,
            borderColor: colors.pillBorder,
          }}
          className="px-2.5 py-1 rounded-xl border flex-row items-center active:opacity-70"
        >
          <Text className="text-xs mr-1">🔄</Text>
          <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">
            Actualizar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Filtro Rápido */}
      {items.length > 3 && (
        <View
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          }}
          className="rounded-xl px-3 py-1.5 border flex-row items-center mb-2.5"
        >
          <Text className="text-xs mr-1.5">🔍</Text>
          <TextInput
            style={{ color: colors.textPrimary }}
            value={filterQuery}
            onChangeText={setFilterQuery}
            placeholder="Filtrar por ticker o empresa..."
            placeholderTextColor={colors.textMuted}
            className="text-xs flex-1"
          />
          {filterQuery.length > 0 && (
            <TouchableOpacity onPress={() => setFilterQuery('')}>
              <Text style={{ color: colors.textMuted }} className="text-xs font-bold px-1">
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={{ color: colors.textSecondary }} className="text-xs mt-2 font-semibold">
            Cargando cotizaciones...
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
            Busca cualquier acción en el analizador y presiona "⭐ Seguir" para monitorearla en tiempo real.
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
        /* Estructura de Tabla Financiera Densa y Moderna */
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 6,
            elevation: 3,
          }}
          className="rounded-2xl border overflow-hidden flex-1 mb-2"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#6366F1"
                colors={['#6366F1']}
              />
            }
          >
            <View className="flex-row">
              {/* 1. Columna Fija a la Izquierda: Ticker & Empresa */}
              <View
                style={{
                  width: TICKER_COL_WIDTH,
                  borderRightColor: colors.gridLine,
                  backgroundColor: colors.cardBgSubtle,
                }}
                className="border-r"
              >
                {/* Header Ticker */}
                <View
                  style={{
                    height: HEADER_HEIGHT,
                    borderBottomColor: colors.gridLine,
                  }}
                  className="justify-center px-3 border-b"
                >
                  <Text
                    style={{ color: colors.textSecondary }}
                    className="text-[10px] font-black uppercase tracking-wider"
                  >
                    Activo
                  </Text>
                </View>

                {/* Filas de Tickers */}
                {filteredItems.map((item, rIdx) => {
                  const isZebra = rIdx % 2 === 1;
                  return (
                    <TouchableOpacity
                      key={`ticker-col-${item.symbol}-${rIdx}`}
                      onPress={() => onSelectStock(item.symbol)}
                      activeOpacity={0.7}
                      style={{
                        height: ROW_HEIGHT,
                        borderBottomColor: colors.gridLine,
                        backgroundColor: isZebra
                          ? isDark
                            ? 'rgba(30, 41, 59, 0.4)'
                            : 'rgba(241, 245, 249, 0.6)'
                          : 'transparent',
                      }}
                      className={`justify-center px-3 ${
                        rIdx !== filteredItems.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      <View className="flex-row items-center">
                        <Text
                          style={{ color: colors.textPrimary }}
                          className="text-xs font-black font-mono mr-1"
                        >
                          {item.symbol}
                        </Text>
                      </View>
                      <Text
                        style={{ color: colors.textMuted }}
                        className="text-[9px] font-medium"
                        numberOfLines={1}
                      >
                        {item.company_name || item.symbol}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. Columnas Desplazables Horizontalmente */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-1"
              >
                <View>
                  {/* Headers de Columnas Métricas */}
                  <View
                    style={{
                      height: HEADER_HEIGHT,
                      borderBottomColor: colors.gridLine,
                      backgroundColor: colors.cardBgSubtle,
                    }}
                    className="flex-row items-center border-b"
                  >
                    {/* Precio / Var */}
                    <View style={{ width: COL_WIDTH, borderRightColor: colors.gridLine }} className="items-center justify-center border-r">
                      <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider">
                        Precio / 24h
                      </Text>
                    </View>

                    {/* Fair Value */}
                    <View style={{ width: COL_WIDTH, borderRightColor: colors.gridLine }} className="items-center justify-center border-r">
                      <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider">
                        Fair Value
                      </Text>
                    </View>

                    {/* FWD P/E */}
                    <View style={{ width: COL_WIDTH, borderRightColor: colors.gridLine }} className="items-center justify-center border-r">
                      <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider">
                        FWD P/E
                      </Text>
                    </View>

                    {/* Alertas */}
                    <View style={{ width: 68, borderRightColor: colors.gridLine }} className="items-center justify-center border-r">
                      <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider">
                        Alerta
                      </Text>
                    </View>

                    {/* Acción Eliminar */}
                    <View style={{ width: 54 }} className="items-center justify-center">
                      <Text style={{ color: colors.textSecondary }} className="text-[10px] font-black uppercase tracking-wider">
                        Borrar
                      </Text>
                    </View>
                  </View>

                  {/* Filas de Datos Tabulares */}
                  {filteredItems.map((item, rIdx) => {
                    const isZebra = rIdx % 2 === 1;
                    const price = Number(item.price) || 0;
                    const changePct = Number(item.change_percent) || 0;
                    const isPos = changePct >= 0;
                    const fairVal = Number(item.fair_value) || 0;
                    const fwdPe = Number(item.forward_pe) || 0;
                    const alertCount = getAlertCountForSymbol(item.symbol);

                    return (
                      <View
                        key={`row-metrics-${item.symbol}-${rIdx}`}
                        style={{
                          height: ROW_HEIGHT,
                          borderBottomColor: colors.gridLine,
                          backgroundColor: isZebra
                            ? isDark
                              ? 'rgba(30, 41, 59, 0.4)'
                              : 'rgba(241, 245, 249, 0.6)'
                            : 'transparent',
                        }}
                        className={`flex-row items-center ${
                          rIdx !== filteredItems.length - 1 ? 'border-b' : ''
                        }`}
                      >
                        {/* Celda: Precio + % Change */}
                        <TouchableOpacity
                          onPress={() => onSelectStock(item.symbol)}
                          activeOpacity={0.7}
                          style={{ width: COL_WIDTH, borderRightColor: colors.gridLine }}
                          className="h-full justify-center items-center px-1 border-r"
                        >
                          <Text style={{ color: colors.textPrimary }} className="text-xs font-black">
                            ${price.toFixed(2)}
                          </Text>
                          <Text
                            style={{ color: isPos ? colors.positive : colors.negative }}
                            className="text-[10px] font-extrabold"
                          >
                            {isPos ? '+' : ''}
                            {changePct.toFixed(2)}%
                          </Text>
                        </TouchableOpacity>

                        {/* Celda: Fair Value */}
                        <TouchableOpacity
                          onPress={() => onSelectStock(item.symbol)}
                          activeOpacity={0.7}
                          style={{ width: COL_WIDTH, borderRightColor: colors.gridLine }}
                          className="h-full justify-center items-center px-1 border-r"
                        >
                          <Text
                            style={{ color: fairVal > 0 ? colors.positive : colors.textMuted }}
                            className="text-xs font-black"
                          >
                            {fairVal > 0 ? `$${fairVal.toFixed(2)}` : '—'}
                          </Text>
                          <Text style={{ color: colors.textMuted }} className="text-[9px]">
                            Consenso
                          </Text>
                        </TouchableOpacity>

                        {/* Celda: FWD P/E */}
                        <TouchableOpacity
                          onPress={() => onSelectStock(item.symbol)}
                          activeOpacity={0.7}
                          style={{ width: COL_WIDTH, borderRightColor: colors.gridLine }}
                          className="h-full justify-center items-center px-1 border-r"
                        >
                          <Text
                            style={{ color: fwdPe > 0 ? colors.chartPrimary : colors.textMuted }}
                            className="text-xs font-bold"
                          >
                            {fwdPe > 0 ? `${fwdPe.toFixed(1)}x` : '—'}
                          </Text>
                          <Text style={{ color: colors.textMuted }} className="text-[9px]">
                            Múltiplo
                          </Text>
                        </TouchableOpacity>

                        {/* Celda: Botón Alertas (🔔) */}
                        <View
                          style={{ width: 68, borderRightColor: colors.gridLine }}
                          className="h-full justify-center items-center border-r"
                        >
                          <TouchableOpacity
                            onPress={() => handleOpenAlert(item)}
                            style={{
                              backgroundColor: alertCount > 0 ? 'rgba(99, 102, 241, 0.2)' : colors.pillBg,
                              borderColor: alertCount > 0 ? '#6366F1' : colors.pillBorder,
                            }}
                            className="p-1.5 rounded-xl border flex-row items-center active:scale-95"
                          >
                            <Text className="text-xs">🔔</Text>
                            {alertCount > 0 && (
                              <View className="ml-1 bg-indigo-600 px-1 rounded-full">
                                <Text className="text-[8px] font-black text-white">
                                  {alertCount}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>

                        {/* Celda: Botón Eliminar (🗑️) */}
                        <View style={{ width: 54 }} className="h-full justify-center items-center">
                          <TouchableOpacity
                            onPress={() => handleRemove(item.symbol)}
                            className="p-1.5 rounded-xl active:bg-rose-500/20"
                          >
                            <Text className="text-xs text-slate-400">🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Modal de Alertas Interactivo */}
      {selectedStockForAlert && (
        <AlertModal
          visible={alertModalVisible}
          onClose={() => setAlertModalVisible(false)}
          symbol={selectedStockForAlert.symbol}
          companyName={selectedStockForAlert.companyName}
          currentPrice={selectedStockForAlert.price}
          onAlertCreated={() => loadData()}
        />
      )}
    </View>
  );
};
