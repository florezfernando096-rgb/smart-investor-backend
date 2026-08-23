import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import { createLinePath, sanitizeNumber, formatXAxisLabel } from './SvgChartUtils';

interface Props {
  title: string;
  periods: string[];
  barValues: number[];
  barLabel: string;
  lineValues: number[];
  lineLabel: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 56;
const CHART_HEIGHT = 175;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 28;
const PADDING_LEFT = 20;
const PADDING_RIGHT = 20;

export const DualAxisBarLineChart: React.FC<Props> = ({
  title,
  periods,
  barValues,
  barLabel,
  lineValues,
  lineLabel,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const safePeriods = periods || [];
  const safeBarValues = (barValues || []).map(v => sanitizeNumber(v, 0));
  const safeLineValues = (lineValues || []).map(v => sanitizeNumber(v, 0));

  if (safePeriods.length === 0 || safeBarValues.length === 0) return null;

  const maxBar = Math.max(...safeBarValues, 10);
  const maxLine = Math.max(...safeLineValues, 100);
  const minLine = Math.min(...safeLineValues, 0);

  const usableWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const count = safePeriods.length;
  const colWidth = usableWidth / count;
  const barWidth = Math.min(20, colWidth * 0.55);

  // Puntos para la línea
  const linePoints = safeLineValues.map((val, idx) => {
    const x = PADDING_LEFT + idx * colWidth + colWidth / 2;
    const y = PADDING_TOP + usableHeight - ((val - minLine) / (maxLine - minLine || 1)) * usableHeight;
    return { x, y };
  });

  const linePath = createLinePath(linePoints);

  const activePeriod = selectedIndex !== null ? safePeriods[selectedIndex] : null;
  const activeBarVal = selectedIndex !== null ? safeBarValues[selectedIndex] : null;
  const activeLineVal = selectedIndex !== null ? safeLineValues[selectedIndex] : null;

  return (
    <View className="bg-[#0f172a] rounded-2xl p-3.5 mb-3 border border-slate-800 shadow-md">
      {/* 1. Fila de Título */}
      <Text className="text-xs font-black text-slate-200 mb-1.5">{title}</Text>

      {/* 2. Fila de Leyendas separada */}
      <View className="flex-row items-center justify-between mb-2 flex-wrap">
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-3 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
            <View className="w-2 h-2 bg-sky-400 rounded-sm mr-1.5" />
            <Text className="text-[10px] font-semibold text-slate-400">{barLabel}</Text>
          </View>
          <View className="flex-row items-center bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
            <View className="w-2.5 h-0.5 bg-emerald-400 mr-1.5" />
            <Text className="text-[10px] font-semibold text-slate-400">{lineLabel}</Text>
          </View>
        </View>

        {/* Tooltip con Valor Seleccionado al pulsar */}
        {activePeriod && (
          <View className="bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
            <Text className="text-[10px] font-bold text-indigo-300">
              {`${activePeriod}: ${activeBarVal?.toFixed(1)} | ${activeLineVal?.toFixed(1)}%`}
            </Text>
          </View>
        )}
      </View>

      {/* 3. Gráfico SVG Interactivo */}
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Línea Base */}
        <Line
          x1={PADDING_LEFT}
          y1={CHART_HEIGHT - PADDING_BOTTOM}
          x2={CHART_WIDTH - PADDING_RIGHT}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke="#334155"
        />

        {/* Barras */}
        {safeBarValues.map((val, idx) => {
          const isSelected = selectedIndex === idx;
          const barHeight = (val / maxBar) * usableHeight;
          const x = PADDING_LEFT + idx * colWidth + (colWidth - barWidth) / 2;
          const y = CHART_HEIGHT - PADDING_BOTTOM - barHeight;
          return (
            <Rect
              key={`bar-${idx}`}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(2, barHeight)}
              rx={3}
              fill={isSelected ? '#38bdf8' : '#0284c7'}
              opacity={isSelected ? 1 : 0.8}
            />
          );
        })}

        {/* Línea de Margen */}
        <Path d={linePath} fill="none" stroke="#10b981" strokeWidth={2.2} />

        {/* Puntos de la línea */}
        {linePoints.map((pt, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <Circle
              key={`pt-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={isSelected ? 5 : 3.5}
              fill={isSelected ? '#ffffff' : '#10b981'}
              stroke="#0f172a"
              strokeWidth={isSelected ? 2 : 1.5}
            />
          );
        })}

        {/* Etiquetas de Periodos en Eje X formateadas sin solapamiento */}
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

      {/* Áreas táctiles transparentes sobre cada columna */}
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
