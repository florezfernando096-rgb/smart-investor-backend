import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { KpiItem } from '../types/dashboard';
import { useTheme } from '../context/ThemeContext';

interface Props {
  kpis: KpiItem[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - 56) / 2;

export const KpiGrid: React.FC<Props> = ({ kpis }) => {
  const { colors, isDark } = useTheme();

  if (!kpis || kpis.length === 0) return null;

  return (
    <View className="my-2">
      <Text
        style={{ color: colors.textPrimary }}
        className="text-sm font-extrabold uppercase tracking-wider mb-2.5 px-1"
      >
        📋 Resumen (Key Metrics)
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {kpis.map((kpi, idx) => (
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
            }}
            className="rounded-2xl p-3 mb-2.5 border justify-center"
          >
            <Text
              style={{ color: colors.textSecondary }}
              className="text-[11px] font-semibold uppercase tracking-wider mb-1"
              numberOfLines={1}
            >
              {kpi.label}
            </Text>
            <Text
              style={{ color: colors.textPrimary }}
              className="text-sm font-extrabold tracking-tight"
              numberOfLines={1}
            >
              {kpi.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
