import React from 'react';
import { View, Text } from 'react-native';
import { FairValueData } from '../types/dashboard';

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
  if (!data) return null;

  const undVal = Number(data.undervalued_percentage) || 0;
  const isUnder = undVal > 0;
  const badgeBg = isUnder ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-amber-500/20 border-amber-500/40';

  return (
    <View className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 shadow-lg my-2">
      {/* Cabecera con Badge Adaptable */}
      <View className="flex-row justify-between items-center mb-3 flex-wrap gap-y-1.5">
        <Text className="text-xs font-black text-white uppercase tracking-wider mr-2">
          🎯 Fair Value (Valor Intrínseco)
        </Text>
        <View className={`px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
          <Text className={`text-[11px] font-extrabold ${isUnder ? 'text-emerald-400' : 'text-amber-400'}`}>
            {`${data.status || 'Consenso'} ${formatPct(data.undervalued_percentage)}`}
          </Text>
        </View>
      </View>

      {/* Valor Consensuado Principal */}
      <View className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 mb-3 items-center">
        <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Fair Value Consensuado
        </Text>
        <Text className="text-2xl font-black text-emerald-400 tracking-tight">
          {formatUSD(data.consensus_fair_value)}
        </Text>
        <Text className="text-[11px] text-slate-400 mt-1">
          {`Precio actual: ${formatUSD(data.current_price)}`}
        </Text>
      </View>

      {/* Desglose de Modelos */}
      <View className="flex-row justify-between">
        {/* EPS Model */}
        <View className="flex-1 bg-slate-900/60 rounded-xl p-2.5 mr-1.5 border border-slate-800/80 items-center">
          <Text className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
            EPS Model
          </Text>
          <Text className="text-xs font-bold text-white">
            {formatUSD(data.eps_model)}
          </Text>
        </View>

        {/* DCF Model */}
        <View className="flex-1 bg-slate-900/60 rounded-xl p-2.5 mx-1.5 border border-slate-800/80 items-center">
          <Text className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
            DCF Model
          </Text>
          <Text className="text-xs font-bold text-white">
            {formatUSD(data.dcf_model)}
          </Text>
        </View>

        {/* Morningstar */}
        <View className="flex-1 bg-slate-900/60 rounded-xl p-2.5 ml-1.5 border border-slate-800/80 items-center">
          <Text className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
            Morningstar
          </Text>
          <Text className="text-xs font-bold text-white">
            {formatUSD(data.morningstar_fair_value)}
          </Text>
        </View>
      </View>
    </View>
  );
};
