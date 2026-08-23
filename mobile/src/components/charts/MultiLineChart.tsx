import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import { createLinePath, sanitizeNumber, formatXAxisLabel } from './SvgChartUtils';
import { useTheme } from '../../context/ThemeContext';

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
  const { colors, isDark } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const safePeriods = periods || [];
  const safeSeries = (series || []).map(s => ({
    label: s?.label || '',
    color: s?.color || colors.chartPrimary,
    values: (s?.values || []).map(v => sanitizeNumber(v, 0)),
  }));

  if (safePeriods.length === 0 || safeSeries.length === 0) return null;

  const allVals = safeSeries.flatMap(s => s.values);
  
  const actualMin = Math.min(...allVals);
  const actualMax = Math.max(...allVals);
  
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
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 3,
        elevation: 1.5,
      }}
      className="rounded-2xl p-3.5 mb-3 border"
    >
      {/* 1. Título */}
      <Text style={{ color: colors.textPrimary }} className="text-xs font-black mb-1.5">
        {title}
      </Text>

      {/* 2. Leyendas en Fila Separada */}
      <View className="flex-row items-center justify-between mb-2 flex-wrap">
        <View className="flex-row items-center flex-wrap">
          {safeSeries.map((s, idx) => (
            <View
              key={`s-lbl-${idx}`}
              style={{
                backgroundColor: colors.pillBg,
                borderColor: colors.pillBorder,
              }}
              className="flex-row items-center mr-2 mb-1 px-2 py-0.5 rounded-md border"
            >
              <View className="w-2.5 h-0.5 mr-1.5" style={{ backgroundColor: s.color }} />
              <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold">
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Tooltip con Valor Seleccionado */}
        {activePeriod && (
          <View
            style={{
              backgroundColor: colors.tooltipBg,
            }}
            className="px-2 py-0.5 rounded shadow-sm"
          >
            <Text style={{ color: colors.tooltipText }} className="text-[10px] font-bold">
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
          stroke={colors.gridLine}
        />

        {/* Eje X */}
        {safePeriods.map((period, idx) => {
          const isSelected = selectedIndex === idx;
          const x = PADDING_LEFT + idx * stepX;
          return (
            <SvgText
              key={`lbl-${idx}`}
              x={x}
              y={CHART_HEIGHT - 10}
              fontSize="9"
              fontWeight={isSelected ? 'bold' : 'normal'}
              fill={isSelected ? colors.textPrimary : colors.textSecondary}
              textAnchor="middle"
            >
              {formatXAxisLabel(period, idx, count)}
            </SvgText>
          );
        })}

        {/* Líneas y Puntos */}
        {safeSeries.map((s, sIdx) => {
          const points = s.values.map((v, idx) => ({
            x: PADDING_LEFT + idx * stepX,
            y: PADDING_TOP + usableHeight - ((v - minVal) / valRange) * usableHeight,
          }));

          const path = createLinePath(points);

          return (
            <React.Fragment key={`series-path-${sIdx}`}>
              <Path d={path} fill="none" stroke={s.color} strokeWidth={2.4} strokeLinecap="round" />
              {points.map((pt, pIdx) => {
                const isSelected = selectedIndex === pIdx;
                return (
                  <Circle
                    key={`pt-${sIdx}-${pIdx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 4.5 : 2.5}
                    fill={isSelected ? '#FFFFFF' : s.color}
                    stroke={s.color}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Capa de Toque Invisible */}
      <View
        style={{
          position: 'absolute',
          top: PADDING_TOP + 40,
          left: PADDING_LEFT + 14,
          width: usableWidth,
          height: usableHeight,
          flexDirection: 'row',
        }}
      >
        {safePeriods.map((_, idx) => (
          <TouchableOpacity
            key={`touch-${idx}`}
            style={{ flex: 1, height: '100%' }}
            onPress={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
            activeOpacity={0.4}
          />
        ))}
      </View>
    </View>
  );
};
