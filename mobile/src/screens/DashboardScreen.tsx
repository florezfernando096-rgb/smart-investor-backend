import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  fetchDashboardData,
  getActiveCookieString,
  setActiveCookieString,
  getCustomServerUrl,
  setCustomServerUrl,
} from '../services/apiService';
import { DashboardResponse } from '../types/dashboard';
import { SearchBar } from '../components/SearchBar';
import { PriceHeader } from '../components/PriceHeader';
import { InteractivePriceChart } from '../components/charts/InteractivePriceChart';
import { KpiGrid } from '../components/KpiGrid';
import { FairValueCard } from '../components/FairValueCard';
import { TechnicalIndicatorsCard } from '../components/TechnicalIndicatorsCard';
import { AccordionSection } from '../components/AccordionSection';
import { DualAxisBarLineChart } from '../components/charts/DualAxisBarLineChart';
import { GroupedBarChart } from '../components/charts/GroupedBarChart';
import { MultiLineChart } from '../components/charts/MultiLineChart';
import { SimpleBarChart } from '../components/charts/SimpleBarChart';
import { ValuationRatiosGrid } from '../components/charts/ValuationRatiosGrid';
import { EstimatesTable } from '../components/EstimatesTable';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  isStockInWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../services/watchlistService';

interface Props {
  selectedSymbol?: string;
  onWatchlistChanged?: () => void;
}

export const DashboardScreen: React.FC<Props> = ({
  selectedSymbol,
  onWatchlistChanged,
}) => {
  const { isDark, colors, toggleTheme } = useTheme();
  const { user, signOut, isDemoUser } = useAuth();

  const [symbol, setSymbol] = useState(selectedSymbol || 'MSFT');
  const [periodType, setPeriodType] = useState<'annual' | 'quarterly'>('annual');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [sourceMode, setSourceMode] = useState<'cloud' | 'local' | 'direct' | 'demo'>('cloud');
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // Modal de Configuración y Cookies
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getCustomServerUrl());
  const [cookieInput, setCookieInput] = useState(getActiveCookieString());

  const checkWatchlistStatus = async (targetSymbol: string) => {
    if (!user?.id) return;
    const status = await isStockInWatchlist(user.id, targetSymbol);
    setIsWatchlisted(status);
  };

  const loadData = async (targetSymbol: string, targetPeriod: 'annual' | 'quarterly') => {
    setLoading(true);
    try {
      const result = await fetchDashboardData(targetSymbol, targetPeriod);
      if (result && result.data) {
        setData(result.data);
        setSourceMode(result.source);
      }
      await checkWatchlistStatus(targetSymbol);
    } catch (err) {
      console.warn('Error cargando dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedSymbol && selectedSymbol !== symbol) {
      setSymbol(selectedSymbol);
      loadData(selectedSymbol, periodType);
    } else {
      loadData(symbol, periodType);
    }
  }, [selectedSymbol]);

  const handleSearch = (newSymbol: string) => {
    setSymbol(newSymbol);
    loadData(newSymbol, periodType);
  };

  const handlePeriodToggle = (newPeriod: 'annual' | 'quarterly') => {
    setPeriodType(newPeriod);
    loadData(symbol, newPeriod);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(symbol, periodType);
  };

  const handleToggleWatchlist = async () => {
    if (!user?.id) {
      Alert.alert('Inicia Sesión', 'Debes iniciar sesión para guardar acciones en tu Watchlist.');
      return;
    }

    if (isWatchlisted) {
      setIsWatchlisted(false);
      await removeFromWatchlist(user.id, symbol);
      if (onWatchlistChanged) onWatchlistChanged();
    } else {
      setIsWatchlisted(true);
      const fairValNum = Number(data?.fair_value?.consensus_fair_value) || 0;
      const fwdPeNum = Number(data?.estimates?.metrics?.find(m => m.label.includes('Forward P/E'))?.values?.[0]?.replace('x', '')) || 0;

      await addToWatchlist({
        user_id: user.id,
        symbol: symbol.toUpperCase(),
        company_name: data?.company_name || symbol,
        price: data?.price_header?.price || 0,
        change: data?.price_header?.change || 0,
        change_percent: data?.price_header?.change_percent || 0,
        fair_value: fairValNum,
        forward_pe: fwdPeNum,
      });
      if (onWatchlistChanged) onWatchlistChanged();
    }
  };

  const handleSaveSettings = () => {
    if (serverUrlInput.trim()) {
      setCustomServerUrl(serverUrlInput.trim());
    }
    setActiveCookieString(cookieInput);
    setSettingsModalVisible(false);
    Alert.alert('Configuración Guardada', 'Se guardó la URL del servidor y las cookies. Recargando datos...');
    loadData(symbol, periodType);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.bg }} className="flex-1">
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      {/* Header Fijo con Marca, Toggle Theme, Estado Cloud y Logout */}
      <View
        style={{
          backgroundColor: colors.cardBg,
          borderBottomColor: colors.cardBorder,
        }}
        className="px-4 py-3 border-b flex-row justify-between items-center"
      >
        <View className="flex-row items-center">
          <Text className="text-xl mr-1.5">⚡</Text>
          <Text
            style={{ color: colors.textPrimary }}
            className="text-lg font-black tracking-wider"
          >
            SMART<Text className="text-indigo-600 dark:text-indigo-400">INVESTOR</Text>
          </Text>
        </View>

        <View className="flex-row items-center">
          {/* Botón Switch Modo Claro / Oscuro (☀️ / 🌙) */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={{
              backgroundColor: colors.pillBg,
              borderColor: colors.pillBorder,
            }}
            className="w-8 h-8 rounded-full items-center justify-center mr-1.5 border active:opacity-70"
          >
            <Text className="text-sm">{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          {/* Badge de Estado / Origen de Datos */}
          <TouchableOpacity
            onPress={() => setSettingsModalVisible(true)}
            style={{
              backgroundColor: colors.pillBg,
              borderColor: colors.pillBorder,
            }}
            className="flex-row items-center px-2 py-1 rounded-full border mr-1.5 active:opacity-70"
          >
            <View
              className={`w-2 h-2 rounded-full mr-1 ${
                sourceMode === 'cloud'
                  ? 'bg-emerald-500'
                  : sourceMode === 'local'
                  ? 'bg-sky-500'
                  : sourceMode === 'direct'
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
            />
            <Text
              style={{ color: colors.textSecondary }}
              className="text-[10px] font-bold"
            >
              {sourceMode === 'cloud'
                ? 'Cloud'
                : sourceMode === 'local'
                ? 'Local'
                : sourceMode === 'direct'
                ? 'Scraper'
                : 'Demo'}
            </Text>
          </TouchableOpacity>

          {/* Botón Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: colors.pillBg,
              borderColor: colors.pillBorder,
            }}
            className="w-8 h-8 rounded-full items-center justify-center border active:opacity-70"
          >
            <Text className="text-xs">🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ErrorBoundary onReset={() => loadData(symbol, periodType)}>
        <ScrollView
          style={{ backgroundColor: colors.bg }}
          className="flex-1 px-4 pt-3"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.chartPrimary}
              colors={[colors.chartPrimary]}
            />
          }
        >
          {/* A. Buscador Superior */}
          <SearchBar
            onSearch={handleSearch}
            loading={loading}
            activeSymbol={symbol}
          />

          {data && (
            <>
              {/* B. Cabecera de Precio con Botón de Watchlist */}
              <PriceHeader
                symbol={data?.symbol || symbol}
                companyName={data?.company_name || symbol}
                data={data?.price_header}
                isWatchlisted={isWatchlisted}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Gráfico de Precio Interactivo (1Y / 10Y con Min/Max) */}
              {data?.price_chart && (
                <InteractivePriceChart data={data.price_chart} />
              )}

              {/* C. Sección Resumen (8 KPIs en Grid 2x4) */}
              {data?.kpis_summary && (
                <KpiGrid
                  kpis={data.kpis_summary}
                  currentPrice={data?.price_header?.price}
                />
              )}

              {/* D. Sección Fair Value */}
              {data?.fair_value && (
                <FairValueCard data={data.fair_value} />
              )}

              {/* E. Sección Indicadores Técnicos */}
              {data?.technical_indicators && (
                <TechnicalIndicatorsCard data={data.technical_indicators} />
              )}

              {/* F. Sección FINANCIALS (Acordeón Plegable con 7 Gráficas) */}
              {data?.financials && (
                <AccordionSection
                  title="📊 Financials (Estados Financieros)"
                  badgeText="7 Gráficas"
                  defaultOpen={true}
                  rightControl={
                    <View
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.cardBorder,
                      }}
                      className="flex-row rounded-lg p-0.5 border"
                    >
                      <TouchableOpacity
                        onPress={() => handlePeriodToggle('annual')}
                        className={`px-2 py-0.5 rounded ${periodType === 'annual' ? 'bg-indigo-600' : 'bg-transparent'}`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            periodType === 'annual' ? 'text-white' : colors.textSecondary
                          }`}
                        >
                          Anual
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handlePeriodToggle('quarterly')}
                        className={`px-2 py-0.5 rounded ${periodType === 'quarterly' ? 'bg-indigo-600' : 'bg-transparent'}`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            periodType === 'quarterly' ? 'text-white' : colors.textSecondary
                          }`}
                        >
                          Trimestral
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                >
                  {/* Gráfica 1: Revenues vs Gross Profit Ratio */}
                  <DualAxisBarLineChart
                    title="1. Ingresos vs Margen Bruto"
                    periods={data?.financials?.periods || []}
                    barValues={data?.financials?.chart1_rev_gp?.revenues || []}
                    barLabel="Ingresos ($B)"
                    lineValues={data?.financials?.chart1_rev_gp?.gross_profit_ratio || []}
                    lineLabel="Gross Margin %"
                  />

                  {/* Gráfica 2: Revenues vs Net Income */}
                  <GroupedBarChart
                    title="2. Ingresos vs Beneficio Neto ($B)"
                    periods={data?.financials?.periods || []}
                    series1={{
                      label: 'Ingresos',
                      values: data?.financials?.chart2_rev_net?.revenues || [],
                      color: colors.chartPrimary,
                    }}
                    series2={{
                      label: 'Net Income',
                      values: data?.financials?.chart2_rev_net?.net_income || [],
                      color: colors.chartSecondary,
                    }}
                  />

                  {/* Gráfica 3: Margins Comparison */}
                  <MultiLineChart
                    title="3. Márgenes de Rentabilidad (%)"
                    periods={data?.financials?.periods || []}
                    series={[
                      { label: 'Gross Margin', values: data?.financials?.chart3_margins?.gross_margin || [], color: colors.chartPrimary },
                      { label: 'EBITDA Margin', values: data?.financials?.chart3_margins?.ebitda_margin || [], color: colors.chartTertiary },
                      { label: 'Net Margin', values: data?.financials?.chart3_margins?.net_margin || [], color: colors.chartPurple },
                    ]}
                    suffix="%"
                  />

                  {/* Gráfica 4: Basic EPS */}
                  <SimpleBarChart
                    title="4. Diluted EPS ($ por Acción)"
                    periods={data?.financials?.periods || []}
                    values={data?.financials?.chart4_eps?.eps || []}
                    unit="$"
                    positiveColor={colors.chartSecondary}
                    negativeColor={colors.negative}
                  />

                  {/* Gráfica 5: Shares Diluted */}
                  <MultiLineChart
                    title="5. Acciones Diluidas en Circulación ($B)"
                    periods={data?.financials?.periods || []}
                    series={[
                      { label: 'Shares Diluted', values: data?.financials?.chart5_shares?.shares || [], color: '#06b6d4' },
                    ]}
                    suffix="B"
                    autoscale={true}
                  />

                  {/* Gráfica 6: Deuda y Solvencia */}
                  <MultiLineChart
                    title="6. Deuda Total vs Caja Neta ($B)"
                    periods={data?.financials?.periods || []}
                    series={[
                      { label: 'Total Debt', values: data?.financials?.chart6_debt_solvency?.total_debt || [], color: colors.negative },
                      { label: 'Cash & Equiv.', values: data?.financials?.chart6_debt_solvency?.cash || [], color: colors.chartSecondary },
                      { label: 'Net Debt', values: data?.financials?.chart6_debt_solvency?.net_debt || [], color: colors.chartTertiary },
                    ]}
                    suffix="B"
                  />

                  {/* Gráfica 7: Free Cash Flow */}
                  <SimpleBarChart
                    title="7. Free Cash Flow ($B)"
                    periods={data?.financials?.periods || []}
                    values={data?.financials?.chart7_fcf?.fcf || []}
                    unit="$"
                    positiveColor={colors.chartSecondary}
                    negativeColor={colors.negative}
                  />
                </AccordionSection>
              )}

              {/* G. Sección HISTORICAL RATIOS (Grid 2x4) */}
              {data?.historical_ratios && (
                <AccordionSection
                  title="🏛️ Historical Ratios (Múltiplos a 10 Años)"
                  badgeText="8 Múltiplos"
                  defaultOpen={true}
                >
                  <ValuationRatiosGrid data={data.historical_ratios} />
                </AccordionSection>
              )}

              {/* H. Sección ESTIMATES (Tabla de Proyecciones a 5 Años > 2026) */}
              {data?.estimates && (
                <AccordionSection
                  title="🔮 Estimates (Proyecciones a 5 Años)"
                  badgeText={`${data.estimates.periods?.length || 6} Columnas`}
                  defaultOpen={true}
                >
                  <EstimatesTable data={data.estimates} />
                </AccordionSection>
              )}

              <View className="h-10" />
            </>
          )}
        </ScrollView>
      </ErrorBoundary>

      {/* Modal de Configuración, Servidor Cloud y Cookies */}
      <Modal
        visible={settingsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-4">
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            }}
            className="w-full rounded-3xl p-5 border shadow-2xl"
          >
            <Text
              style={{ color: colors.textPrimary }}
              className="text-base font-black mb-1"
            >
              ⚙️ Conexión & Servidor Cloud
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-xs mb-3">
              Configura el backend en la nube para que la app funcione 100% independiente 24/7.
            </Text>

            {/* Input URL del Servidor Cloud */}
            <Text
              style={{ color: colors.textPrimary }}
              className="text-[11px] font-bold mb-1"
            >
              URL Servidor Backend (Render / Cloudflare / Local):
            </Text>
            <View
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
              className="rounded-xl p-2.5 border mb-3"
            >
              <TextInput
                style={{ color: colors.textPrimary }}
                className="font-mono text-xs"
                value={serverUrlInput}
                onChangeText={setServerUrlInput}
                placeholder="https://tu-api.onrender.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Input Cookies */}
            <Text
              style={{ color: colors.textPrimary }}
              className="text-[11px] font-bold mb-1"
            >
              Cookies de thesmartinvestortool.com (Opcional):
            </Text>
            <View
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
              className="rounded-xl p-2.5 border mb-4 h-16"
            >
              <TextInput
                style={{ color: colors.textPrimary }}
                className="font-mono text-xs flex-1"
                value={cookieInput}
                onChangeText={setCookieInput}
                placeholder="sessionid=...; csrftoken=..."
                placeholderTextColor={colors.textMuted}
                multiline={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setSettingsModalVisible(false)}
                style={{
                  backgroundColor: colors.pillBg,
                  borderColor: colors.pillBorder,
                }}
                className="flex-1 py-3 rounded-xl mr-2 items-center border"
              >
                <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">
                  Cerrar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveSettings}
                className="flex-1 bg-indigo-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white text-xs font-bold">Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
