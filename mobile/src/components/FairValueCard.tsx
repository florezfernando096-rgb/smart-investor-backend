import React from 'react';
import { View, Text } from 'react-native';
import { FairValueData } from '../types/dashboard';
import { useTheme } from '../context/ThemeContext';

interface Props {
  data: FairValueData;
}

function formatUSD(val: any): string {
  if (val === null || val === undefined || isNaN(Number(val))) return 'N/A';
  return `$${Number(val).toFixed(2)}`;
}

function formatPct(val: any): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '0.0%';
  const num = Number(val);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

export const FairValueCard: React.FC<Props> = ({ data }) => {
  const { colors, isDark } = useTheme();

  if (!data) return null;

  const undVal = Number(data.undervalued_percentage) || 0;
  const isUnder = undVal > 0;

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
      {/* Cabecera con Badge Adaptable */}
      <View className="flex-row justify-between items-center mb-3 flex-wrap gap-y-1.5">
        <Text
          style={{ color: colors.textPrimary }}
          className="text-xs font-black uppercase tracking-wider mr-2"
        >
          🎯 Fair Value (Valor Intrínseco)
        </Text>
        <View
          style={{
            backgroundColor: isUnder ? colors.positiveBg : 'rgba(217, 119, 6, 0.12)',
            borderColor: isUnder ? colors.positiveBorder : 'rgba(217, 119, 6, 0.3)',
          }}
          className="px-2.5 py-0.5 rounded-full border"
        >
          <Text
            style={{ color: isUnder ? colors.positive : colors.chartTertiary }}
            className="text-[11px] font-extrabold"
          >
            {`${data.status || 'Consenso'} ${formatPct(data.undervalued_percentage)}`}
          </Text>
        </View>
      </View>

      {/* Valor Consensuado Principal */}
      <View
        style={{
          backgroundColor: colors.cardBgSubtle,
          borderColor: colors.cardBorder,
        }}
        className="rounded-xl p-3.5 border mb-3 items-center"
      >
        <Text
          style={{ color: colors.textSecondary }}
          className="text-xs font-semibold uppercase tracking-wider mb-1"
        >
          Fair Value Consensuado
        </Text>
        <Text
          style={{ color: colors.positive }}
          className="text-2xl font-black tracking-tight"
        >
          {formatUSD(data.consensus_fair_value)}
        </Text>
        <Text style={{ color: colors.textMuted }} className="text-[11px] mt-1">
          {`Precio actual: ${formatUSD(data.current_price)}`}
        </Text>
      </View>

      {/* Desglose de Modelos */}
      <View className="flex-row justify-between">
        {/* EPS Model */}
        <View
          style={{
            backgroundColor: colors.cardBgSubtle,
            borderColor: colors.cardBorder,
          }}
          className="flex-1 rounded-xl p-2.5 mr-1.5 border items-center"
        >
          <Text
            style={{ color: colors.textSecondary }}
            className="text-[10px] font-semibold uppercase mb-1"
          >
            EPS Model
          </Text>
          <Text
            style={{ color: colors.textPrimary }}
            className="text-xs font-bold"
          >
            {formatUSD(data.eps_model)}
          </Text>
        </View>

        {/* DCF Model */}
        <View
          style={{
            backgroundColor: colors.cardBgSubtle,
            borderColor: colors.cardBorder,
          }}
          className="flex-1 rounded-xl p-2.5 mx-1.5 border items-center"
        >
          <Text
            style={{ color: colors.textSecondary }}
            className="text-[10px] font-semibold uppercase mb-1"
          >
            DCF Model
          </Text>
          <Text
            style={{ color: colors.textPrimary }}
            className="text-xs font-bold"
          >
            {formatUSD(data.dcf_model)}
          </Text>
        </View>

        {/* Morningstar */}
        <View
          style={{
            backgroundColor: colors.cardBgSubtle,
            borderColor: colors.cardBorder,
          }}
          className="flex-1 rounded-xl p-2.5 ml-1.5 border items-center"
        >
          <Text
            style={{ color: colors.textSecondary }}
            className="text-[10px] font-semibold uppercase mb-1"
          >
            Morningstar
          </Text>
          <Text
            style={{ color: colors.textPrimary }}
            className="text-xs font-bold"
          >
            {formatUSD(data.morningstar_fair_value)}
          </Text>
        </View>
      </View>
    </View>
  );
};
