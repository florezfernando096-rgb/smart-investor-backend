import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { sanitizeNumber, formatXAxisLabel } from './SvgChartUtils';

interface Props {
  title: string;
  periods: string[];
  values: number[];
  unit?: string;
  positiveColor?: string;
  negativeColor?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 56;
const CHART_HEIGHT = 175;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 28;
const PADDING_LEFT = 20;
const PADDING_RIGHT = 20;

export const SimpleBarChart: React.FC<Props> = ({
  title,
  periods,
  values,
  unit = '$',
  positiveColor = '#10b981',
  negativeColor = '#ef4444',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const safePeriods = periods || [];
  const safeValues = (values || []).map(v => sanitizeNumber(v, 0));

  if (safePeriods.length === 0 || safeValues.length === 0) return null;

  const maxVal = Math.max(...safeValues, 1);
  const minVal = Math.min(...safeValues, 0);
  const range = maxVal - minVal || 1;

  const usableWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const count = safePeriods.length;
  const colWidth = usableWidth / count;
  const barWidth = Math.min(20, colWidth * 0.55);

  const zeroY = CHART_HEIGHT - PADDING_BOTTOM - ((0 - minVal) / range) * usableHeight;

  const activePeriod = selectedIndex !== null ? safePeriods[selectedIndex] : null;
  const activeVal = selectedIndex !== null ? safeValues[selectedIndex] : null;

  return (
    <View className="bg-[#0f172a] rounded-2xl p-3.5 mb-3 border border-slate-800 shadow-md">
      {/* 1. Título */}
      <Text className="text-xs font-black text-slate-200 mb-1.5">{title}</Text>

      {/* 2. Leyendas / Unidad en Fila Separada */}
      <View className="flex-row items-center justify-between mb-2 flex-wrap">
        <View className="bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
          <Text className="text-[10px] font-semibold text-slate-400">{`Unidad: ${unit}`}</Text>
        </View>

        {/* Tooltip con Valor Seleccionado */}
        {activePeriod && (
          <View className="bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
            <Text className="text-[10px] font-bold text-indigo-300">
              {`${activePeriod}: ${unit}${activeVal?.toFixed(2)}`}
            </Text>
          </View>
        )}
      </View>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Línea Zero */}
        <Line
          x1={PADDING_LEFT}
          y1={zeroY}
          x2={CHART_WIDTH - PADDING_RIGHT}
          y2={zeroY}
          stroke="#475569"
          strokeWidth={1}
        />

        {safeValues.map((val, idx) => {
          const isSelected = selectedIndex === idx;
          const isPos = val >= 0;
          const barHeight = (Math.abs(val) / range) * usableHeight;
          const x = PADDING_LEFT + idx * colWidth + (colWidth - barWidth) / 2;
          const y = isPos ? zeroY - barHeight : zeroY;

          return (
            <Rect
              key={`bar-${idx}`}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(2, barHeight)}
              rx={2}
              fill={isPos ? positiveColor : negativeColor}
              opacity={isSelected ? 1 : 0.85}
            />
          );
        })}

        {safePeriods.map((period, idx) => {
          const label = formatXAxisLabel(period, idx, count);
          if (!label) return null;
          const x = PADDING_LEFT + idx * colWidth + colWidth / 2;
          return (
            <SvgText
              key={`lbl-${idx}`}
              x={x}
              y={CHART_HEIGHT - 8}
              fontSize="8.5"
              fontWeight={selectedIndex === idx ? 'bold' : 'normal'}
              fill={selectedIndex === idx ? '#38bdf8' : '#94a3b8'}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      {/* Áreas táctiles transparentes */}
      <View
        style={{
          position: 'absolute',
          top: 60,
          left: PADDING_LEFT + 12,
          width: usableWidth,
          height: usableHeight,
          flexDirection: 'row',
        }}
      >
        {safePeriods.map((_, idx) => (
          <TouchableOpacity
            key={`touch-${idx}`}
            style={{ width: colWidth, height: usableHeight }}
            onPress={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
            activeOpacity={0.6}
          />
        ))}
      </View>
    </View>
  );
};
