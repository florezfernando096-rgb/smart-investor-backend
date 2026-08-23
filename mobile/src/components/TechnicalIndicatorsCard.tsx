import React from 'react';
import { View, Text } from 'react-native';
import { TechnicalIndicatorsData } from '../types/dashboard';

interface Props {
  data: TechnicalIndicatorsData;
}

function fmtVal(v: any, decimals: number, fallback: string): string {
  if (v === null || v === undefined || isNaN(Number(v))) return fallback;
  return Number(v).toFixed(decimals);
}

export const TechnicalIndicatorsCard: React.FC<Props> = ({ data }) => {
  if (!data) return null;

  const rsi = data.rsi || { value: 50, status: 'Neutral', color: '#38bdf8' };
  const rsiVal = Number(rsi.value) || 50;
  const rsiColor = rsiVal >= 70 ? '#ef4444' : rsiVal <= 30 ? '#10b981' : '#38bdf8';

  const renderMaItem = (label: string, item: { value: number; diff_pct: number; bullish: boolean }) => {
    const isBull = !!item?.bullish;
    const diffPct = Number(item?.diff_pct) || 0;
    const diffSign = diffPct >= 0 ? '+' : '';
    return (
      <View className="flex-1 bg-slate-900/60 rounded-xl p-2.5 mx-1 border border-slate-800/80 items-center">
        <Text className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">
          {label}
        </Text>
        <Text className="text-xs font-bold text-white mb-0.5">
          ${fmtVal(item?.value, 2, '0.00')}
        </Text>
        <Text className={`text-[10px] font-bold ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>
          {`${diffSign}${fmtVal(item?.diff_pct, 1, '0.0')}%`}
        </Text>
      </View>
    );
  };

  return (
    <View className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 shadow-lg my-2">
      <Text className="text-sm font-extrabold text-white uppercase tracking-wider mb-3">
        🚦 Indicadores Técnicos
      </Text>

      {/* RSI (14) */}
      <View className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 mb-3">
        <View className="flex-row justify-between items-center mb-1.5">
          <Text className="text-xs font-bold text-slate-300">RSI (14)</Text>
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
        <View className="h-2 bg-slate-800 rounded-full overflow-hidden flex-row">
          {/* Zona Sobreventa (0 - 30) */}
          <View className="flex-[30] bg-emerald-500/30 border-r border-slate-700" />
          {/* Zona Neutral (30 - 70) */}
          <View className="flex-[40] bg-sky-500/20 border-r border-slate-700" />
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
