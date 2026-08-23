import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { KpiItem } from '../types/dashboard';

interface Props {
  kpis: KpiItem[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - 56) / 2;

export const KpiGrid: React.FC<Props> = ({ kpis }) => {
  if (!kpis || kpis.length === 0) return null;

  return (
    <View className="my-2">
      <Text className="text-sm font-extrabold text-white uppercase tracking-wider mb-2.5 px-1">
        📋 Resumen (Key Metrics)
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {kpis.map((kpi, idx) => (
          <View
            key={`kpi-${idx}`}
            style={{ width: ITEM_WIDTH }}
            className="bg-[#0f172a] rounded-2xl p-3 mb-2.5 border border-slate-800 shadow-sm justify-center"
          >
            <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1" numberOfLines={1}>
              {kpi.label}
            </Text>
            <Text className="text-sm font-extrabold text-white tracking-tight" numberOfLines={1}>
              {kpi.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
