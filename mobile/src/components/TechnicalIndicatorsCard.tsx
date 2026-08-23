import React from 'react';
import { View, Text } from 'react-native';
import { TechnicalIndicatorsData } from '../types/dashboard';
import { useTheme } from '../context/ThemeContext';

interface Props {
  data: TechnicalIndicatorsData;
}

function fmtVal(v: any, decimals: number, fallback: string): string {
  if (v === null || v === undefined || isNaN(Number(v))) return fallback;
  return Number(v).toFixed(decimals);
}

export const TechnicalIndicatorsCard: React.FC<Props> = ({ data }) => {
  const { colors, isDark } = useTheme();

  if (!data) return null;

  const rsi = data.rsi || { value: 50, status: 'Neutral', color: '#38bdf8' };
  const rsiVal = Number(rsi.value) || 50;
  const rsiColor = rsiVal >= 70 ? colors.negative : rsiVal <= 30 ? colors.positive : colors.chartPrimary;

  const renderMaItem = (label: string, item: { value: number; diff_pct: number; bullish: boolean }) => {
    const isBull = !!item?.bullish;
    const diffPct = Number(item?.diff_pct) || 0;
    const diffSign = diffPct >= 0 ? '+' : '';
    return (
      <View
        style={{
          backgroundColor: colors.cardBgSubtle,
          borderColor: colors.cardBorder,
        }}
        className="flex-1 rounded-xl p-2.5 mx-1 border items-center"
      >
        <Text
          style={{ color: colors.textSecondary }}
          className="text-[10px] font-semibold uppercase mb-0.5"
        >
          {label}
        </Text>
        <Text
          style={{ color: colors.textPrimary }}
          className="text-xs font-bold mb-0.5"
        >
          ${fmtVal(item?.value, 2, '0.00')}
        </Text>
        <Text
          style={{ color: isBull ? colors.positive : colors.negative }}
          className="text-[10px] font-extrabold"
        >
          {`${diffSign}${fmtVal(item?.diff_pct, 1, '0.0')}%`}
        </Text>
      </View>
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
        shadowRadius: 4,
        elevation: 2,
      }}
      className="rounded-2xl p-4 border my-2"
    >
      <Text
        style={{ color: colors.textPrimary }}
        className="text-sm font-extrabold uppercase tracking-wider mb-3"
      >
        🚦 Indicadores Técnicos
      </Text>

      {/* RSI (14) */}
      <View
        style={{
          backgroundColor: colors.cardBgSubtle,
          borderColor: colors.cardBorder,
        }}
        className="rounded-xl p-3 border mb-3"
      >
        <View className="flex-row justify-between items-center mb-1.5">
          <Text style={{ color: colors.textPrimary }} className="text-xs font-bold">
            RSI (14)
          </Text>
          <View className="flex-row items-center">
            <View
              className="w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: rsiColor }}
            />
            <Text className="text-xs font-extrabold" style={{ color: rsiColor }}>
              {`${rsiVal.toFixed(0)} (${rsi.status || 'Neutral'})`}
            </Text>
          </View>
        </View>

        {/* Barra de progreso de RSI */}
        <View
          style={{ backgroundColor: colors.gridLine }}
          className="h-2 rounded-full overflow-hidden flex-row"
        >
          {/* Zona Sobreventa (0 - 30) */}
          <View className="flex-[30] bg-emerald-500/30" />
          {/* Zona Neutral (30 - 70) */}
          <View className="flex-[40] bg-sky-500/20" />
          {/* Zona Sobrecompra (70 - 100) */}
          <View className="flex-[30] bg-rose-500/30" />
        </View>
      </View>

      {/* Medias Móviles */}
      <View className="flex-row justify-between">
        {renderMaItem('MA 20', data?.ma20)}
        {renderMaItem('MA 50', data?.ma50)}
        {renderMaItem('MA 200', data?.ma200)}
      </View>
    </View>
  );
};
