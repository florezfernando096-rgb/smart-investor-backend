import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { PriceChartData } from '../../types/dashboard';
import { createLinePath, createSmoothAreaPath, formatCurrency } from './SvgChartUtils';

interface Props {
  data: PriceChartData;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 190;
const PADDING_TOP = 25;
const PADDING_BOTTOM = 30;
const PADDING_HORIZONTAL = 20;

export const InteractivePriceChart: React.FC<Props> = ({ data }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1Y' | '10Y'>('1Y');

  const tfData = selectedTimeframe === '1Y' ? data.timeframe_1y : data.timeframe_10y;
  const candles = tfData?.candles || [];
  const minPrice = tfData?.min_price || 0;
  const maxPrice = tfData?.max_price || 100;
  const currentPrice = tfData?.current || candles[candles.length - 1]?.close || 0;

  // Si no hay velas, fallback básico
  if (candles.length < 2) {
    return (
      <View className="h-48 bg-[#0f172a] rounded-2xl items-center justify-center border border-slate-800 my-2">
        <Text className="text-slate-400 text-sm">Cargando gráfico de precios...</Text>
      </View>
    );
  }

  const prices = candles.map(c => c.close);
  const actualMin = Math.min(...prices);
  const actualMax = Math.max(...prices);
  const range = actualMax - actualMin || 1;

  const minIndex = prices.indexOf(actualMin);
  const maxIndex = prices.indexOf(actualMax);

  const usableWidth = CHART_WIDTH - PADDING_HORIZONTAL * 2;
  const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const points = candles.map((c, idx) => {
    const x = PADDING_HORIZONTAL + (idx / (candles.length - 1)) * usableWidth;
    const y = PADDING_TOP + usableHeight - ((c.close - actualMin) / range) * usableHeight;
    return { x, y };
  });

  const linePath = createLinePath(points);
  const areaPath = createSmoothAreaPath(points, CHART_HEIGHT - PADDING_BOTTOM);

  const isUp = currentPrice >= candles[0].close;
  const strokeColor = isUp ? '#10b981' : '#ef4444';
  const gradientId = isUp ? 'priceGradientGreen' : 'priceGradientRed';

  const minPoint = points[minIndex] || { x: 0, y: 0 };
  const maxPoint = points[maxIndex] || { x: 0, y: 0 };

  return (
    <View className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 shadow-lg my-3">
      {/* Selector de Temporalidad */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Evolución del Precio
        </Text>
        <View className="flex-row bg-slate-900 rounded-xl p-1 border border-slate-800">
          <TouchableOpacity
            onPress={() => setSelectedTimeframe('1Y')}
            className={`px-3 py-1 rounded-lg ${selectedTimeframe === '1Y' ? 'bg-indigo-600' : 'bg-transparent'}`}
          >
            <Text className={`text-xs font-bold ${selectedTimeframe === '1Y' ? 'text-white' : 'text-slate-400'}`}>
              1 Año
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTimeframe('10Y')}
            className={`px-3 py-1 rounded-lg ${selectedTimeframe === '10Y' ? 'bg-indigo-600' : 'bg-transparent'}`}
          >
            <Text className={`text-xs font-bold ${selectedTimeframe === '10Y' ? 'text-white' : 'text-slate-400'}`}>
              10 Años
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gráfico SVG */}
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="priceGradientGreen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </LinearGradient>
          <LinearGradient id="priceGradientRed" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Líneas Guía Horizontales */}
        <Line
          x1={PADDING_HORIZONTAL}
          y1={PADDING_TOP}
          x2={CHART_WIDTH - PADDING_HORIZONTAL}
          y2={PADDING_TOP}
          stroke="#1e293b"
          strokeDasharray="4,4"
        />
        <Line
          x1={PADDING_HORIZONTAL}
          y1={PADDING_TOP + usableHeight / 2}
          x2={CHART_WIDTH - PADDING_HORIZONTAL}
          y2={PADDING_TOP + usableHeight / 2}
          stroke="#1e293b"
          strokeDasharray="4,4"
        />
        <Line
          x1={PADDING_HORIZONTAL}
          y1={CHART_HEIGHT - PADDING_BOTTOM}
          x2={CHART_WIDTH - PADDING_HORIZONTAL}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke="#334155"
        />

        {/* Área Sombreada y Línea */}
        <Path d={areaPath} fill={`url(#${gradientId})`} />
        <Path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2.5} />

        {/* Indicador de Máximo */}
        <Circle cx={maxPoint.x} cy={maxPoint.y} r={5} fill="#10b981" stroke="#0f172a" strokeWidth={2} />
        <Rect
          x={Math.max(10, Math.min(CHART_WIDTH - 70, maxPoint.x - 30))}
          y={Math.max(2, maxPoint.y - 20)}
          width={60}
          height={16}
          rx={4}
          fill="#10b981"
        />
        <SvgText
          x={Math.max(10, Math.min(CHART_WIDTH - 70, maxPoint.x - 30)) + 30}
          y={Math.max(2, maxPoint.y - 20) + 11}
          fontSize="9"
          fontWeight="bold"
          fill="#090d16"
          textAnchor="middle"
        >
          {`Max: $${actualMax.toFixed(0)}`}
        </SvgText>

        {/* Indicador de Mínimo */}
        <Circle cx={minPoint.x} cy={minPoint.y} r={5} fill="#ef4444" stroke="#0f172a" strokeWidth={2} />
        <Rect
          x={Math.max(10, Math.min(CHART_WIDTH - 70, minPoint.x - 30))}
          y={Math.min(CHART_HEIGHT - 35, minPoint.y + 6)}
          width={60}
          height={16}
          rx={4}
          fill="#ef4444"
        />
        <SvgText
          x={Math.max(10, Math.min(CHART_WIDTH - 70, minPoint.x - 30)) + 30}
          y={Math.min(CHART_HEIGHT - 35, minPoint.y + 6) + 11}
          fontSize="9"
          fontWeight="bold"
          fill="#ffffff"
          textAnchor="middle"
        >
          {`Min: $${actualMin.toFixed(0)}`}
        </SvgText>

        {/* Fechas de inicio y fin */}
        <SvgText
          x={PADDING_HORIZONTAL}
          y={CHART_HEIGHT - 10}
          fontSize="10"
          fill="#64748b"
          textAnchor="start"
        >
          {candles[0]?.date || 'Inicio'}
        </SvgText>
        <SvgText
          x={CHART_WIDTH - PADDING_HORIZONTAL}
          y={CHART_HEIGHT - 10}
          fontSize="10"
          fill="#64748b"
          textAnchor="end"
        >
          {candles[candles.length - 1]?.date || 'Hoy'}
        </SvgText>
      </Svg>
    </View>
  );
};
