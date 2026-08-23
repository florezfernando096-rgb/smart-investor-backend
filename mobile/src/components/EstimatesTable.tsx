import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { EstimatesTableData, EstimateMetricRow } from '../types/dashboard';
import { useTheme } from '../context/ThemeContext';

interface Props {
  data: EstimatesTableData;
}

const METRIC_NAME_WIDTH = 135;
const COL_WIDTH = 85;
const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 38;

export const EstimatesTable: React.FC<Props> = ({ data }) => {
  const { colors, isDark } = useTheme();

  const periods = data?.periods || [];
  const metrics = data?.metrics || [];

  if (periods.length === 0 || metrics.length === 0) {
    return (
      <View
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        }}
        className="rounded-2xl p-4 border items-center justify-center my-2"
      >
        <Text style={{ color: colors.textSecondary }} className="text-xs">
          No hay proyecciones disponibles para este activo.
        </Text>
      </View>
    );
  }

  const formatShortLabel = (label: string): string => {
    if (label.includes('Revenue')) return 'Revenues';
    if (label.includes('EBITDA')) return 'EBITDA';
    if (label.includes('Net Income')) return 'Net Income';
    if (label.includes('EPS')) return 'Diluted EPS';
    if (label.includes('Forward P/E')) return 'Forward P/E';
    if (label.includes('Free Cash Flow') || label.includes('FCF')) return 'Free Cash Flow';
    if (label.includes('Dividend')) return 'Dividends';
    return label.replace(/\([^)]*\)/g, '').trim();
  };

  const renderYoYText = (yoyStr: string) => {
    if (!yoyStr || yoyStr === '—' || yoyStr === '-') {
      return (
        <Text style={{ color: colors.textMuted }} className="text-[10px] font-semibold">
          —
        </Text>
      );
    }
    const isPos = yoyStr.startsWith('+') || (!yoyStr.startsWith('-') && parseFloat(yoyStr) > 0);
    const color = isPos ? colors.positive : colors.negative;

    return (
      <Text style={{ color }} className="text-[10px] font-extrabold">
        {yoyStr}
      </Text>
    );
  };

  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
      className="rounded-2xl border overflow-hidden my-1"
    >
      {/* Contenedor Principal con Columna Fija a la Izquierda */}
      <View className="flex-row">
        {/* 1. Columna Fija Izquierda: Nombres de Métricas */}
        <View
          style={{
            width: METRIC_NAME_WIDTH,
            borderRightColor: colors.gridLine,
            backgroundColor: colors.cardBgSubtle,
          }}
          className="border-r"
        >
          {/* Header de la Columna Fija */}
          <View
            style={{
              height: HEADER_HEIGHT,
              borderBottomColor: colors.gridLine,
            }}
            className="justify-center px-3 border-b"
          >
            <Text
              style={{ color: colors.textSecondary }}
              className="text-[10px] font-extrabold uppercase tracking-wider"
            >
              Métrica
            </Text>
          </View>

          {/* Filas de Nombres */}
          {metrics.map((row, rIdx) => {
            const isZebra = rIdx % 2 === 1;
            return (
              <View
                key={`metric-name-${rIdx}`}
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
                  rIdx !== metrics.length - 1 ? 'border-b' : ''
                }`}
              >
                <Text
                  style={{ color: colors.textPrimary }}
                  className="text-xs font-bold"
                  numberOfLines={1}
                >
                  {formatShortLabel(row.label)}
                </Text>
                <Text style={{ color: colors.textMuted }} className="text-[9px]">
                  Nominal / YoY
                </Text>
              </View>
            );
          })}
        </View>

        {/* 2. Columnas con Scroll Horizontal: Años Futuros (2027E...2031E + Growth) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
        >
          <View>
            {/* Header de Años */}
            <View
              style={{
                height: HEADER_HEIGHT,
                borderBottomColor: colors.gridLine,
                backgroundColor: colors.cardBgSubtle,
              }}
              className="flex-row items-center border-b"
            >
              {periods.map((period, pIdx) => {
                const isGrowth = period.toLowerCase().includes('growth');
                return (
                  <View
                    key={`header-period-${pIdx}`}
                    style={{
                      width: COL_WIDTH,
                      borderRightColor: pIdx !== periods.length - 1 ? colors.gridLine : 'transparent',
                    }}
                    className="items-center justify-center border-r"
                  >
                    <View
                      style={{
                        backgroundColor: isGrowth
                          ? isDark
                            ? 'rgba(99, 102, 241, 0.25)'
                            : 'rgba(99, 102, 241, 0.15)'
                          : 'transparent',
                      }}
                      className="px-2 py-0.5 rounded-md"
                    >
                      <Text
                        style={{
                          color: isGrowth ? (isDark ? '#818CF8' : '#4F46E5') : colors.textPrimary,
                          fontWeight: isGrowth ? '900' : '800',
                        }}
                        className="text-[11px] font-mono tracking-tight"
                      >
                        {period}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Filas de Datos de Proyección */}
            {metrics.map((row, rIdx) => {
              const isZebra = rIdx % 2 === 1;
              return (
                <View
                  key={`row-data-${rIdx}`}
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
                    rIdx !== metrics.length - 1 ? 'border-b' : ''
                  }`}
                >
                  {periods.map((_, pIdx) => {
                    const val = row.values?.[pIdx] || '—';
                    const yoy = row.yoy?.[pIdx] || '—';

                    return (
                      <View
                        key={`cell-${rIdx}-${pIdx}`}
                        style={{
                          width: COL_WIDTH,
                          borderRightColor: pIdx !== periods.length - 1 ? colors.gridLine : 'transparent',
                        }}
                        className="items-center justify-center px-1 border-r"
                      >
                        {/* Línea Superior: Valor Nominal */}
                        <Text
                          style={{ color: colors.textPrimary }}
                          className="text-xs font-extrabold tracking-tight"
                          numberOfLines={1}
                        >
                          {val}
                        </Text>
                        {/* Línea Inferior: % Change YoY */}
                        <View className="mt-0.5">
                          {renderYoYText(yoy)}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};
