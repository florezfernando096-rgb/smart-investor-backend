import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import { createLinePath, sanitizeNumber, formatXAxisLabel } from './SvgChartUtils';

export interface LineSeries {
  label: string;
  values: number[];
  color: string;
}

interface Props {
  title: string;
  periods: string[];
  series: LineSeries[];
  suffix?: string;
  autoscale?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 56;
const CHART_HEIGHT = 175;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 28;
const PADDING_LEFT = 20;
const PADDING_RIGHT = 20;

export const MultiLineChart: React.FC<Props> = ({
  title,
  periods,
  series,
  suffix = '%',
  autoscale = true,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const safePeriods = periods || [];
  const safeSeries = (series || []).map(s => ({
    label: s?.label || '',
    color: s?.color || '#38bdf8',
    values: (s?.values || []).map(v => sanitizeNumber(v, 0)),
  }));

  if (safePeriods.length === 0 || safeSeries.length === 0) return null;

  const allVals = safeSeries.flatMap(s => s.values);
  
  // Escalado Dinámico: Si autoscale es true, tomar el min real con margen del 5%
  const actualMin = Math.min(...allVals);
  const actualMax = Math.max(...allVals);
  
  // Si los valores no son todos cero, usar escala dinámica para apreciar recompras/dilución
  let minVal = 0;
  let maxVal = 100;
  if (autoscale && allVals.length > 0 && actualMax !== actualMin) {
    const margin = (actualMax - actualMin) * 0.1;
    minVal = Math.max(0, actualMin - margin);
    maxVal = actualMax + margin;
  } else {
    minVal = Math.min(...allVals, 0);
    maxVal = Math.max(...allVals, 100);
  }
  const valRange = maxVal - minVal || 1;

  const usableWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const count = safePeriods.length;
  const stepX = count > 1 ? usableWidth / (count - 1) : 0;

  const activePeriod = selectedIndex !== null ? safePeriods[selectedIndex] : null;

  return (
    <View className="bg-[#0f172a] rounded-2xl p-3.5 mb-3 border border-slate-800 shadow-md">
      {/* 1. Título */}
      <Text className="text-xs font-black text-slate-200 mb-1.5">{title}</Text>

      {/* 2. Leyendas en Fila Separada */}
      <View className="flex-row items-center justify-between mb-2 flex-wrap">
        <View className="flex-row items-center flex-wrap">
          {safeSeries.map((s, idx) => (
            <View key={`s-lbl-${idx}`} className="flex-row items-center mr-2 mb-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
              <View className="w-2.5 h-0.5 mr-1.5" style={{ backgroundColor: s.color }} />
              <Text className="text-[10px] font-semibold text-slate-400">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tooltip con Valor Seleccionado */}
        {activePeriod && (
          <View className="bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
            <Text className="text-[10px] font-bold text-indigo-300">
              {`${activePeriod}: `}
              {safeSeries.map(s => `${s.values[selectedIndex || 0]?.toFixed(1)}${suffix}`).join(' | ')}
            </Text>
          </View>
        )}
      </View>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Line
          x1={PADDING_LEFT}
          y1={CHART_HEIGHT - PADDING_BOTTOM}
          x2={CHART_WIDTH - PADDING_RIGHT}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke="#334155"
        />

        {safeSeries.map((s, sIdx) => {
          const points = s.values.map((v, pIdx) => {
            const x = PADDING_LEFT + pIdx * stepX;
            const y = PADDING_TOP + usableHeight - ((v - minVal) / valRange) * usableHeight;
            return { x, y };
          });

          const path = createLinePath(points);

          return (
            <React.Fragment key={`s-line-${sIdx}`}>
              <Path d={path} fill="none" stroke={s.color} strokeWidth={2.2} />
              {points.map((pt, ptIdx) => {
                const isSelected = selectedIndex === ptIdx;
                return (
                  <Circle
                    key={`pt-${sIdx}-${ptIdx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 5 : 3}
                    fill={isSelected ? '#ffffff' : s.color}
                    stroke="#0f172a"
                    strokeWidth={isSelected ? 2 : 1}
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {safePeriods.map((period, idx) => {
          const label = formatXAxisLabel(period, idx, count);
          if (!label) return null;
          const x = PADDING_LEFT + idx * stepX;
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
          left: PADDING_LEFT + 8,
          width: usableWidth,
          height: usableHeight,
          flexDirection: 'row',
        }}
      >
        {safePeriods.map((_, idx) => (
          <TouchableOpacity
            key={`touch-${idx}`}
            style={{ width: count > 1 ? stepX : usableWidth, height: usableHeight }}
            onPress={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
            activeOpacity={0.6}
          />
        ))}
      </View>
    </View>
  );
};
