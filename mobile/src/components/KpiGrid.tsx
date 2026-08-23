import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { KpiItem } from '../types/dashboard';
import { useTheme } from '../context/ThemeContext';

interface Props {
  kpis: KpiItem[];
  currentPrice?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - 56) / 2;

export const KpiGrid: React.FC<Props> = ({ kpis, currentPrice }) => {
  const { colors, isDark } = useTheme();

  if (!kpis || kpis.length === 0) return null;

  const calculate52WDiff = (kpi: KpiItem): number | null => {
    if (kpi.diff_max_pct !== undefined && kpi.diff_max_pct !== null) {
      return Number(kpi.diff_max_pct);
    }
    if (!currentPrice || currentPrice <= 0 || !kpi.value) return null;

    // Buscar el valor máximo después del guión (ej: "$349.20 - $553.72")
    const match = kpi.value.match(/-\s*\$?([0-9.,]+)/);
    if (!match) return null;

    const maxVal = parseFloat(match[1].replace(/,/g, ''));
    if (isNaN(maxVal) || maxVal <= 0) return null;

    return ((currentPrice - maxVal) / maxVal) * 100;
  };

  return (
    <View className="my-2">
      <Text
        style={{ color: colors.textPrimary }}
        className="text-sm font-extrabold uppercase tracking-wider mb-2.5 px-1"
      >
        📋 Resumen (Key Metrics)
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {kpis.map((kpi, idx) => {
          const is52W = kpi.label.toLowerCase().includes('52w') || kpi.label.toLowerCase().includes('range');
          const diffPct = is52W ? calculate52WDiff(kpi) : null;
          const hasDiff = diffPct !== null && !isNaN(diffPct);
          const isPos = hasDiff && diffPct >= 0;
          const sign = isPos && diffPct > 0 ? '+' : '';

          return (
            <View
              key={`kpi-${idx}`}
              style={{
                width: ITEM_WIDTH,
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                shadowColor: colors.shadowColor,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.3 : 0.05,
                shadowRadius: 3,
                elevation: 1.5,
                minHeight: 70,
              }}
              className="rounded-2xl p-3 mb-2.5 border justify-between"
            >
              {/* Etiqueta del KPI */}
              <Text
                style={{ color: colors.textSecondary }}
                className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                numberOfLines={1}
              >
                {kpi.label}
              </Text>

              {/* Valor Principal */}
              <Text
                style={{ color: colors.textPrimary }}
                className="text-sm font-extrabold tracking-tight font-mono"
                numberOfLines={1}
              >
                {kpi.value}
              </Text>

              {/* Porcentaje respecto al Máximo de 52 Semanas */}
              {is52W && hasDiff && (
                <View className="flex-row items-center mt-1.5">
                  <View
                    style={{
                      backgroundColor: isPos ? colors.positiveBg : colors.negativeBg,
                      borderColor: isPos ? colors.positiveBorder : colors.negativeBorder,
                    }}
                    className="px-1.5 py-0.5 rounded-md border flex-row items-center"
                  >
                    <Text
                      style={{ color: isPos ? colors.positive : colors.negative }}
                      className="text-[10px] font-black font-mono"
                    >
                      {`${sign}${diffPct!.toFixed(2)}% vs máx`}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};
