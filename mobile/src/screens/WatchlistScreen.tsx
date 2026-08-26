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
  refreshLiveMarketQuotes,
  removeFromWatchlist,
} from '../services/watchlistService';
import { fetchStockAlerts, StockAlert } from '../services/alertService';
import { AlertModal } from '../components/AlertModal';

interface Props {
  onSelectStock: (symbol: string) => void;
  onNavigateToSearch: () => void;
}

const TICKER_COL_WIDTH = 120;
const COL_WIDTH = 94;
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
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);

  // Estado para el modal de alerta
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [selectedStockForAlert, setSelectedStockForAlert] = useState<{
    symbol: string;
    companyName?: string;
    price: number;
  } | null>(null);

  const loadInitialData = async () => {
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

      // Si ya hay cotizaciones en memoria para los activos, registrar que están disponibles
      const hasLiveQuotes = wlData.some((i) => (Number(i.price) || 0) > 0);
      if (hasLiveQuotes && !lastUpdatedTime) {
        setLastUpdatedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      }
    } catch (err) {
      console.warn('Error loading watchlist data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [user?.id]);

  /**
   * Actualización bajo demanda (cuando el usuario hace tap en "Actualizar Precios" o pull-to-refresh)
   */
  const handleRefreshPrices = async () => {
    if (items.length === 0 || updatingPrices) return;

    setUpdatingPrices(true);
    try {
      const { updatedItems, successCount } = await refreshLiveMarketQuotes(items);
      setItems([...updatedItems]);

      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastUpdatedTime(nowStr);

      if (successCount === 0 && items.length > 0) {
        Alert.alert(
          'Aviso de Conexión',
          'No se pudieron obtener cotizaciones en vivo en este momento. Verifica tu conexión a internet.'
        );
      }
    } catch (err) {
      console.warn('Error refreshing live quotes:', err);
    } finally {
      setUpdatingPrices(false);
    }
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

  const hasAnyPrices = items.some((i) => (Number(i.price) || 0) > 0);

  return (
    <View style={{ backgroundColor: colors.bg }} className="flex-1 px-3 pt-2">
      {/* Cabecera Principal */}
      <View className="flex-row justify-between items-center mb-2.5 px-1">
        <View className="flex-1 pr-2">
          <View className="flex-row items-center flex-wrap">
            <Text
              style={{ color: colors.textPrimary }}
              className="text-xl font-black tracking-tight mr-2"
            >
              📌 Mi Watchlist
            </Text>
            {lastUpdatedTime && (
              <View className="bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md flex-row items-center mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                <Text className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ACTUALIZADO {lastUpdatedTime}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ color: colors.textSecondary }} className="text-[11px] mt-0.5">
            {items.length} {items.length === 1 ? 'activo guardado' : 'activos guardados'}
          </Text>
        </View>

        {/* Botón de Actualizar Precios Bajo Demanda */}
        {items.length > 0 && (
          <TouchableOpacity
            onPress={handleRefreshPrices}
            disabled={updatingPrices}
            style={{
              backgroundColor: updatingPrices ? colors.cardBgSubtle : (isDark ? '#4F46E5' : '#6366F1'),
              borderColor: isDark ? '#6366F1' : '#4F46E5',
            }}
            className="px-3 py-2 rounded-xl border flex-row items-center active:opacity-80 shadow-sm"
          >
            {updatingPrices ? (
              <ActivityIndicator size="small" color="#818CF8" style={{ marginRight: 5 }} />
            ) : (
              <Text className="text-xs mr-1 text-white">⚡</Text>
            )}
            <Text className="text-xs font-black text-white">
              {updatingPrices ? 'Consultando...' : 'Actualizar Precios'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Banner de Bienvenida si no ha consultado precios aún */}
      {!loading && items.length > 0 && !hasAnyPrices && !updatingPrices && (
        <TouchableOpacity
          onPress={handleRefreshPrices}
          style={{
            backgroundColor: isDark ? 'rgba(79, 70, 229, 0.15)' : 'rgba(99, 102, 241, 0.10)',
            borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
          }}
          className="rounded-xl p-2.5 border mb-2.5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <Text className="text-sm mr-2">💡</Text>
            <Text style={{ color: colors.textPrimary }} className="text-[11px] font-semibold flex-1">
              Toca aquí o en <Text className="font-extrabold text-indigo-500">"Actualizar Precios"</Text> para consultar las cotizaciones en tiempo real.
            </Text>
          </View>
          <View className="bg-indigo-600 px-2 py-1 rounded-lg">
            <Text className="text-[10px] font-black text-white uppercase">Consultar</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Barra de Filtro Rápido si hay varios items */}
      {items.length > 4 && (
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
            Busca cualquier acción en el analizador y presiona "⭐ Seguir" para agregarla a tu lista de monitoreo.
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
                refreshing={updatingPrices}
                onRefresh={handleRefreshPrices}
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
                    const hasPrice = price > 0;
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
                          {hasPrice ? (
                            <>
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
                            </>
                          ) : (
                            <Text style={{ color: colors.textMuted }} className="text-xs font-bold">
                              —
                            </Text>
                          )}
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
                            {fairVal > 0 ? 'Consenso' : 'Sin datos'}
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
                            {fwdPe > 0 ? 'Múltiplo' : 'Sin datos'}
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
          onAlertCreated={() => loadInitialData()}
        />
      )}
    </View>
  );
};
