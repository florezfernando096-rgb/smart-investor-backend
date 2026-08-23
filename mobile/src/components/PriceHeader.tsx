import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PriceHeaderData } from '../types/dashboard';
import { useTheme } from '../context/ThemeContext';

interface Props {
  symbol: string;
  companyName: string;
  data: PriceHeaderData;
  isWatchlisted?: boolean;
  onToggleWatchlist?: () => void;
}

function safeNum(val: any, fallback: number = 0): number {
  if (val === null || val === undefined || isNaN(Number(val))) return fallback;
  return Number(val);
}

export const PriceHeader: React.FC<Props> = ({
  symbol,
  companyName,
  data,
  isWatchlisted = false,
  onToggleWatchlist,
}) => {
  const { colors, isDark } = useTheme();

  const price = safeNum(data?.price, 0);
  const change = safeNum(data?.change, 0);
  const changePct = safeNum(data?.change_percent, 0);
  const postPrice = safeNum(data?.postmarket_price, price);
  const postChange = safeNum(data?.postmarket_change, 0);
  const postPct = safeNum(data?.postmarket_percent, 0);

  const isPos = change >= 0;
  const changeSign = isPos ? '+' : '';
  const postIsPos = postChange >= 0;
  const postSign = postIsPos ? '+' : '';

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
      className="rounded-2xl p-4 border mb-2"
    >
      {/* Título de Empresa, Ticker y Botón de Watchlist */}
      <View className="flex-row justify-between items-center mb-1">
        <View className="flex-1 pr-2">
          <Text
            style={{ color: colors.textPrimary }}
            className="text-xl font-extrabold tracking-tight"
            numberOfLines={1}
          >
            {companyName || symbol}
          </Text>
          <Text className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
            {symbol} • NASDAQ / US
          </Text>
        </View>

        {/* Botón de Agregar / En Seguimiento (Watchlist) */}
        {onToggleWatchlist && (
          <TouchableOpacity
            onPress={onToggleWatchlist}
            style={{
              backgroundColor: isWatchlisted
                ? isDark
                  ? 'rgba(234, 179, 8, 0.2)'
                  : 'rgba(234, 179, 8, 0.15)'
                : colors.pillBg,
              borderColor: isWatchlisted ? '#EAB308' : colors.pillBorder,
            }}
            className="flex-row items-center px-3 py-1.5 rounded-xl border active:opacity-70"
          >
            <Text className="text-sm mr-1">
              {isWatchlisted ? '⭐' : '☆'}
            </Text>
            <Text
              style={{
                color: isWatchlisted ? '#CA8A04' : colors.textSecondary,
                fontWeight: isWatchlisted ? 'bold' : '600',
              }}
              className="text-xs"
            >
              {isWatchlisted ? 'Siguiendo' : 'Seguir'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Precio Actual y Variación */}
      <View className="flex-row items-baseline mt-2">
        <Text
          style={{ color: colors.textPrimary }}
          className="text-3xl font-black tracking-tight mr-3"
        >
          ${price.toFixed(2)}
        </Text>
        <View
          style={{
            backgroundColor: isPos ? colors.positiveBg : colors.negativeBg,
            borderColor: isPos ? colors.positiveBorder : colors.negativeBorder,
          }}
          className="px-2.5 py-0.5 rounded-lg border"
        >
          <Text
            style={{ color: isPos ? colors.positive : colors.negative }}
            className="text-sm font-extrabold"
          >
            {`${changeSign}${change.toFixed(2)} (${changeSign}${changePct.toFixed(2)}%)`}
          </Text>
        </View>
      </View>

      {/* Postmarket / After-Hours */}
      <View
        style={{ borderTopColor: colors.gridLine }}
        className="flex-row items-center mt-2 pt-2 border-t"
      >
        <Text style={{ color: colors.textSecondary }} className="text-xs mr-2">
          Postmarket:
        </Text>
        <Text
          style={{ color: colors.textPrimary }}
          className="text-xs font-bold mr-1.5"
        >
          ${postPrice.toFixed(2)}
        </Text>
        <Text
          style={{ color: postIsPos ? colors.positive : colors.negative }}
          className="text-xs font-semibold"
        >
          {`${postSign}${postChange.toFixed(2)} (${postSign}${postPct.toFixed(2)}%)`}
        </Text>
      </View>
    </View>
  );
};
