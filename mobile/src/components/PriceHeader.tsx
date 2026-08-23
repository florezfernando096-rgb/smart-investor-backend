import React from 'react';
import { View, Text } from 'react-native';
import { PriceHeaderData } from '../types/dashboard';

interface Props {
  symbol: string;
  companyName: string;
  data: PriceHeaderData;
}

function safeNum(val: any, fallback: number = 0): number {
  if (val === null || val === undefined || isNaN(Number(val))) return fallback;
  return Number(val);
}

export const PriceHeader: React.FC<Props> = ({ symbol, companyName, data }) => {
  const price = safeNum(data?.price, 0);
  const change = safeNum(data?.change, 0);
  const changePct = safeNum(data?.change_percent, 0);
  const postPrice = safeNum(data?.postmarket_price, price);
  const postChange = safeNum(data?.postmarket_change, 0);
  const postPct = safeNum(data?.postmarket_percent, 0);

  const isPos = change >= 0;
  const badgeColor = isPos ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  const changeSign = isPos ? '+' : '';

  const postIsPos = postChange >= 0;
  const postSign = postIsPos ? '+' : '';

  return (
    <View className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 shadow-lg mb-2">
      {/* Título de Empresa y Ticker */}
      <View className="flex-row justify-between items-center mb-1">
        <View className="flex-1 pr-2">
          <Text className="text-xl font-extrabold text-white tracking-tight" numberOfLines={1}>
            {companyName || symbol}
          </Text>
          <Text className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
            {symbol} • NASDAQ / US
          </Text>
        </View>
      </View>

      {/* Precio Actual y Variación */}
      <View className="flex-row items-baseline mt-2">
        <Text className="text-3xl font-black text-white tracking-tight mr-3">
          ${price.toFixed(2)}
        </Text>
        <View className={`px-2.5 py-0.5 rounded-lg border ${badgeColor}`}>
          <Text className={`text-sm font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {`${changeSign}${change.toFixed(2)} (${changeSign}${changePct.toFixed(2)}%)`}
          </Text>
        </View>
      </View>

      {/* Postmarket / After-Hours */}
      <View className="flex-row items-center mt-2 pt-2 border-t border-slate-800/80">
        <Text className="text-xs text-slate-400 mr-2">Postmarket:</Text>
        <Text className="text-xs font-bold text-slate-200 mr-1.5">
          ${postPrice.toFixed(2)}
        </Text>
        <Text className={`text-xs font-semibold ${postIsPos ? 'text-emerald-400' : 'text-rose-400'}`}>
          {`${postSign}${postChange.toFixed(2)} (${postSign}${postPct.toFixed(2)}%)`}
        </Text>
      </View>
    </View>
  );
};
