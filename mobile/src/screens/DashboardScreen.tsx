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
import { ErrorBoundary } from '../components/ErrorBoundary';

export const DashboardScreen: React.FC = () => {
  const [symbol, setSymbol] = useState('MSFT');
  const [periodType, setPeriodType] = useState<'annual' | 'quarterly'>('annual');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [sourceMode, setSourceMode] = useState<'cloud' | 'local' | 'direct' | 'demo'>('cloud');

  // Modal de Configuración y Cookies
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getCustomServerUrl());
  const [cookieInput, setCookieInput] = useState(getActiveCookieString());

  const loadData = async (targetSymbol: string, targetPeriod: 'annual' | 'quarterly') => {
    setLoading(true);
    try {
      const result = await fetchDashboardData(targetSymbol, targetPeriod);
      if (result && result.data) {
        setData(result.data);
        setSourceMode(result.source);
      }
    } catch (err) {
      console.warn('Error cargando dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(symbol, periodType);
  }, []);

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

  const handleSaveSettings = () => {
    if (serverUrlInput.trim()) {
      setCustomServerUrl(serverUrlInput.trim());
    }
    setActiveCookieString(cookieInput);
    setSettingsModalVisible(false);
    Alert.alert('Configuración Guardada', 'Se guardó la URL del servidor y las cookies. Recargando datos...');
    loadData(symbol, periodType);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#090d16]">
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Header Fijo con Marca y Botón de Ajustes */}
      <View className="px-4 py-3 bg-[#090d16] border-b border-slate-800/80 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Text className="text-xl mr-1.5">⚡</Text>
          <Text className="text-lg font-black text-white tracking-wider">
            SMART<Text className="text-indigo-400">INVESTOR</Text>
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          {/* Badge de Estado / Origen de Datos */}
          <TouchableOpacity
            onPress={() => setSettingsModalVisible(true)}
            className="flex-row items-center bg-slate-800/90 px-2.5 py-1 rounded-full border border-slate-700 active:bg-slate-700"
          >
            <View
              className={`w-2 h-2 rounded-full mr-1.5 ${
                sourceMode === 'cloud'
                  ? 'bg-emerald-400'
                  : sourceMode === 'local'
                  ? 'bg-sky-400'
                  : sourceMode === 'direct'
                  ? 'bg-amber-400'
                  : 'bg-indigo-400'
              }`}
            />
            <Text className="text-[11px] font-bold text-slate-200">
              {sourceMode === 'cloud'
                ? 'Cloud HTTPS'
                : sourceMode === 'local'
                ? 'Backend Local'
                : sourceMode === 'direct'
                ? 'Scraper Directo'
                : 'Demo Mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ErrorBoundary onReset={() => loadData(symbol, periodType)}>
        <ScrollView
          className="flex-1 px-4 pt-3"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#38bdf8"
              colors={['#38bdf8']}
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
              {/* B. Cabecera de Precio */}
              <PriceHeader
                symbol={data?.symbol || symbol}
                companyName={data?.company_name || symbol}
                data={data?.price_header}
              />

              {/* Gráfico de Precio Interactivo (1Y / 10Y con Min/Max) */}
              {data?.price_chart && (
                <InteractivePriceChart data={data.price_chart} />
              )}

              {/* C. Sección Resumen (8 KPIs en Grid 2x4) */}
              {data?.kpis_summary && (
                <KpiGrid kpis={data.kpis_summary} />
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
                    <View className="flex-row bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                      <TouchableOpacity
                        onPress={() => handlePeriodToggle('annual')}
                        className={`px-2 py-0.5 rounded ${periodType === 'annual' ? 'bg-indigo-600' : 'bg-transparent'}`}
                      >
                        <Text className={`text-[10px] font-bold ${periodType === 'annual' ? 'text-white' : 'text-slate-400'}`}>
                          Anual
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handlePeriodToggle('quarterly')}
                        className={`px-2 py-0.5 rounded ${periodType === 'quarterly' ? 'bg-indigo-600' : 'bg-transparent'}`}
                      >
                        <Text className={`text-[10px] font-bold ${periodType === 'quarterly' ? 'text-white' : 'text-slate-400'}`}>
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
                    title="2. Ingresos vs Beneficio Neto"
                    periods={data?.financials?.periods || []}
                    series1={{ label: 'Ingresos ($B)', values: data?.financials?.chart2_rev_net?.revenues || [], color: '#38bdf8' }}
                    series2={{ label: 'Net Income ($B)', values: data?.financials?.chart2_rev_net?.net_income || [], color: '#10b981' }}
                  />

                  {/* Gráfica 3: Márgenes de Rentabilidad */}
                  <MultiLineChart
                    title="3. Márgenes de Rentabilidad (%)"
                    periods={data?.financials?.periods || []}
                    series={[
                      { label: 'Gross Margin', values: data?.financials?.chart3_margins?.gross_margin || [], color: '#38bdf8' },
                      { label: 'EBITDA Margin', values: data?.financials?.chart3_margins?.ebitda_margin || [], color: '#f59e0b' },
                      { label: 'Net Margin', values: data?.financials?.chart3_margins?.net_margin || [], color: '#10b981' },
                    ]}
                  />

                  {/* Gráfica 4: Diluted EPS */}
                  <SimpleBarChart
                    title="4. Diluted EPS Histórico ($)"
                    periods={data?.financials?.periods || []}
                    values={data?.financials?.chart4_eps?.eps || []}
                    unit="$"
                    positiveColor="#10b981"
                    negativeColor="#ef4444"
                  />

                  {/* Gráfica 5: Acciones en Circulación (Dilución/Recompras) */}
                  <MultiLineChart
                    title="5. Acciones en Circulación (Shares Diluted)"
                    periods={data?.financials?.periods || []}
                    series={[
                      { label: 'Shares (B)', values: data?.financials?.chart5_shares?.shares || [], color: '#818cf8' },
                    ]}
                    suffix="B"
                  />

                  {/* Gráfica 6: Solvencia y Deuda */}
                  <GroupedBarChart
                    title="6. Deuda Total vs Efectivo ($B)"
                    periods={data?.financials?.periods || []}
                    series1={{ label: 'Total Debt', values: data?.financials?.chart6_debt_solvency?.total_debt || [], color: '#ef4444' }}
                    series2={{ label: 'Cash & Equiv', values: data?.financials?.chart6_debt_solvency?.cash || [], color: '#10b981' }}
                  />

                  {/* Gráfica 7: Flujo de Caja Libre + Crecimiento YoY */}
                  <DualAxisBarLineChart
                    title="7. Free Cash Flow vs Crecimiento YoY"
                    periods={data?.financials?.periods || []}
                    barValues={data?.financials?.chart7_fcf?.fcf || []}
                    barLabel="FCF ($B)"
                    lineValues={data?.financials?.chart7_fcf?.growth_yoy || []}
                    lineLabel="YoY Growth %"
                  />
                </AccordionSection>
              )}

              {/* G. Sección HISTORICAL RATIOS (Acordeón Plegable con 8 Gráficas) */}
              {data?.historical_ratios && (
                <AccordionSection
                  title="🏛️ Historical Ratios (Múltiplos a 10 Años)"
                  badgeText="8 Múltiplos"
                  defaultOpen={false}
                >
                  <ValuationRatiosGrid data={data.historical_ratios} />
                </AccordionSection>
              )}

              {/* H. Sección ESTIMATES / PROYECCIONES (Acordeón Plegable con 3 Gráficas) */}
              {data?.estimates && (
                <AccordionSection
                  title="🔮 Estimates (Proyecciones 2027E - 2031E)"
                  badgeText="Consenso 5Y"
                  defaultOpen={false}
                >
                  {/* Gráfica E1: Multilínea de Crecimiento */}
                  <MultiLineChart
                    title="E1. Proyección de Crecimiento ($B)"
                    periods={data?.estimates?.periods_5y || []}
                    series={[
                      { label: 'Revenues', values: data?.estimates?.chart_e1_growth?.revenues || [], color: '#38bdf8' },
                      { label: 'EBITDA', values: data?.estimates?.chart_e1_growth?.ebitda || [], color: '#f59e0b' },
                      { label: 'Net Income', values: data?.estimates?.chart_e1_growth?.net_income || [], color: '#10b981' },
                    ]}
                    suffix="B"
                  />

                  {/* Gráfica E2: Valoración Futura */}
                  <DualAxisBarLineChart
                    title="E2. EPS Proyectado vs Forward P/E"
                    periods={data?.estimates?.periods_5y || []}
                    barValues={data?.estimates?.chart_e2_valuation?.eps_projected || []}
                    barLabel="EPS ($)"
                    lineValues={data?.estimates?.chart_e2_valuation?.forward_pe || []}
                    lineLabel="Forward P/E"
                  />

                  {/* Gráfica E3: Transición de FCF */}
                  <MultiLineChart
                    title="E3. Transición de Free Cash Flow ($B)"
                    periods={data?.estimates?.periods_5y || []}
                    series={[
                      { label: 'Projected FCF', values: data?.estimates?.chart_e3_fcf?.fcf_projected || [], color: '#10b981' },
                    ]}
                    suffix="B"
                  />
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
          <View className="w-full bg-[#0f172a] rounded-3xl p-5 border border-slate-700 shadow-2xl">
            <Text className="text-base font-black text-white mb-1">
              ⚙️ Conexión & Servidor Cloud
            </Text>
            <Text className="text-xs text-slate-400 mb-3">
              Configura el backend en la nube para que la app funcione 100% independiente 24/7.
            </Text>

            {/* Input URL del Servidor Cloud */}
            <Text className="text-[11px] font-bold text-slate-300 mb-1">
              URL Servidor Backend (Render / Cloudflare / Local):
            </Text>
            <View className="bg-slate-900 rounded-xl p-2.5 border border-slate-700 mb-3">
              <TextInput
                className="text-white font-mono text-xs"
                value={serverUrlInput}
                onChangeText={setServerUrlInput}
                placeholder="https://tu-api.onrender.com"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Input Cookies */}
            <Text className="text-[11px] font-bold text-slate-300 mb-1">
              Cookies de thesmartinvestortool.com (Opcional):
            </Text>
            <View className="bg-slate-900 rounded-xl p-2.5 border border-slate-700 mb-4 h-16">
              <TextInput
                className="text-white font-mono text-xs flex-1"
                value={cookieInput}
                onChangeText={setCookieInput}
                placeholder="sessionid=...; csrftoken=..."
                placeholderTextColor="#64748b"
                multiline={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setSettingsModalVisible(false)}
                className="flex-1 bg-slate-800 py-3 rounded-xl mr-2 items-center"
              >
                <Text className="text-slate-300 text-xs font-bold">Cerrar</Text>
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
