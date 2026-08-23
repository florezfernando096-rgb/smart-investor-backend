import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { PriceChartData } from '../../types/dashboard';
import { createLinePath, createSmoothAreaPath } from './SvgChartUtils';
import { useTheme } from '../../context/ThemeContext';

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
  const { colors, isDark } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1Y' | '10Y'>('1Y');

  const tfData = selectedTimeframe === '1Y' ? data.timeframe_1y : data.timeframe_10y;
  const candles = tfData?.candles || [];
  const currentPrice = tfData?.current || candles[candles.length - 1]?.close || 0;

  if (candles.length < 2) {
    return (
      <View
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        }}
        className="h-48 rounded-2xl items-center justify-center border my-2"
      >
        <Text style={{ color: colors.textSecondary }} className="text-sm">
          Cargando gráfico de precios...
        </Text>
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
  const strokeColor = isUp ? colors.positive : colors.negative;
  const gradientId = isUp ? 'priceGradGreen' : 'priceGradRed';

  const minPoint = points[minIndex] || { x: 0, y: 0 };
  const maxPoint = points[maxIndex] || { x: 0, y: 0 };

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
      className="rounded-2xl p-4 border my-3"
    >
      {/* Selector de Temporalidad */}
      <View className="flex-row justify-between items-center mb-3">
        <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase tracking-wider">
          Evolución del Precio
        </Text>
        <View
          style={{
            backgroundColor: colors.pillBg,
            borderColor: colors.pillBorder,
          }}
          className="flex-row rounded-xl p-1 border"
        >
          <TouchableOpacity
            onPress={() => setSelectedTimeframe('1Y')}
            className={`px-3 py-1 rounded-lg ${selectedTimeframe === '1Y' ? 'bg-indigo-600' : 'bg-transparent'}`}
          >
            <Text className={`text-xs font-bold ${selectedTimeframe === '1Y' ? 'text-white' : colors.textSecondary}`}>
              1 Año
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTimeframe('10Y')}
            className={`px-3 py-1 rounded-lg ${selectedTimeframe === '10Y' ? 'bg-indigo-600' : 'bg-transparent'}`}
          >
            <Text className={`text-xs font-bold ${selectedTimeframe === '10Y' ? 'text-white' : colors.textSecondary}`}>
              10 Años
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gráfico SVG */}
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="priceGradGreen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.positive} stopOpacity={isDark ? 0.4 : 0.22} />
            <Stop offset="100%" stopColor={colors.positive} stopOpacity="0.0" />
          </LinearGradient>
          <LinearGradient id="priceGradRed" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.negative} stopOpacity={isDark ? 0.4 : 0.22} />
            <Stop offset="100%" stopColor={colors.negative} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Líneas Guía Horizontales */}
        <Line
          x1={PADDING_HORIZONTAL}
          y1={PADDING_TOP}
          x2={CHART_WIDTH - PADDING_HORIZONTAL}
          y2={PADDING_TOP}
          stroke={colors.gridLine}
          strokeDasharray="4,4"
        />
        <Line
          x1={PADDING_HORIZONTAL}
          y1={PADDING_TOP + usableHeight / 2}
          x2={CHART_WIDTH - PADDING_HORIZONTAL}
          y2={PADDING_TOP + usableHeight / 2}
          stroke={colors.gridLine}
          strokeDasharray="4,4"
        />
        <Line
          x1={PADDING_HORIZONTAL}
          y1={CHART_HEIGHT - PADDING_BOTTOM}
          x2={CHART_WIDTH - PADDING_HORIZONTAL}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke={colors.gridLine}
        />

        {/* Área Sombreada y Línea */}
        <Path d={areaPath} fill={`url(#${gradientId})`} />
        <Path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2.5} />

        {/* Indicador de Máximo */}
        <Circle cx={maxPoint.x} cy={maxPoint.y} r={5} fill={colors.positive} stroke={colors.cardBg} strokeWidth={2} />
        <Rect
          x={Math.max(10, Math.min(CHART_WIDTH - 70, maxPoint.x - 30))}
          y={Math.max(2, maxPoint.y - 20)}
          width={60}
          height={16}
          rx={4}
          fill={colors.positive}
        />
        <SvgText
          x={Math.max(10, Math.min(CHART_WIDTH - 70, maxPoint.x - 30)) + 30}
          y={Math.max(2, maxPoint.y - 20) + 11}
          fontSize="9"
          fontWeight="bold"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          {`Max: $${actualMax.toFixed(0)}`}
        </SvgText>

        {/* Indicador de Mínimo */}
        <Circle cx={minPoint.x} cy={minPoint.y} r={5} fill={colors.negative} stroke={colors.cardBg} strokeWidth={2} />
        <Rect
          x={Math.max(10, Math.min(CHART_WIDTH - 70, minPoint.x - 30))}
          y={Math.min(CHART_HEIGHT - 35, minPoint.y + 6)}
          width={60}
          height={16}
          rx={4}
          fill={colors.negative}
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
          fontWeight="bold"
          fill={colors.textSecondary}
          textAnchor="start"
        >
          {candles[0]?.date || 'Inicio'}
        </SvgText>
        <SvgText
          x={CHART_WIDTH - PADDING_HORIZONTAL}
          y={CHART_HEIGHT - 10}
          fontSize="10"
          fontWeight="bold"
          fill={colors.textSecondary}
          textAnchor="end"
        >
          {candles[candles.length - 1]?.date || 'Hoy'}
        </SvgText>
      </Svg>
    </View>
  );
};
