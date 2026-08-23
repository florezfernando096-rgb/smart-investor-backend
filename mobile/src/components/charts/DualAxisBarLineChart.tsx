import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import { createLinePath, sanitizeNumber, formatXAxisLabel } from './SvgChartUtils';
import { useTheme } from '../../context/ThemeContext';

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
  const { colors, isDark } = useTheme();
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
      {/* 1. Fila de Título */}
      <Text style={{ color: colors.textPrimary }} className="text-xs font-black mb-1.5">
        {title}
      </Text>

      {/* 2. Fila de Leyendas separada */}
      <View className="flex-row items-center justify-between mb-2 flex-wrap">
        <View className="flex-row items-center">
          <View
            style={{
              backgroundColor: colors.pillBg,
              borderColor: colors.pillBorder,
            }}
            className="flex-row items-center mr-3 px-2 py-0.5 rounded-md border"
          >
            <View style={{ backgroundColor: colors.chartPrimary }} className="w-2 h-2 rounded-sm mr-1.5" />
            <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold">
              {barLabel}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.pillBg,
              borderColor: colors.pillBorder,
            }}
            className="flex-row items-center px-2 py-0.5 rounded-md border"
          >
            <View style={{ backgroundColor: colors.chartSecondary }} className="w-2.5 h-0.5 mr-1.5" />
            <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold">
              {lineLabel}
            </Text>
          </View>
        </View>

        {/* Tooltip con Valor Seleccionado al pulsar */}
        {activePeriod && (
          <View
            style={{
              backgroundColor: colors.tooltipBg,
            }}
            className="px-2 py-0.5 rounded shadow-sm"
          >
            <Text style={{ color: colors.tooltipText }} className="text-[10px] font-bold">
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
          stroke={colors.gridLine}
        />

        {/* Barras y Columnas táctiles */}
        {safeBarValues.map((val, idx) => {
          const barHeight = Math.max(2, (val / maxBar) * usableHeight);
          const x = PADDING_LEFT + idx * colWidth + (colWidth - barWidth) / 2;
          const y = PADDING_TOP + usableHeight - barHeight;
          const isSelected = selectedIndex === idx;

          return (
            <React.Fragment key={`bar-group-${idx}`}>
              {/* Barra */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={3}
                fill={isSelected ? '#60A5FA' : colors.chartPrimary}
                opacity={isSelected ? 1 : 0.85}
              />

              {/* Etiqueta Eje X */}
              <SvgText
                x={PADDING_LEFT + idx * colWidth + colWidth / 2}
                y={CHART_HEIGHT - 10}
                fontSize="9"
                fontWeight={isSelected ? 'bold' : 'normal'}
                fill={isSelected ? colors.textPrimary : colors.textSecondary}
                textAnchor="middle"
              >
                {formatXAxisLabel(safePeriods[idx], idx, count)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Línea */}
        <Path d={linePath} fill="none" stroke={colors.chartSecondary} strokeWidth={2.4} strokeLinecap="round" />

        {/* Puntos de la Línea */}
        {linePoints.map((pt, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <Circle
              key={`pt-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={isSelected ? 4.5 : 2.5}
              fill={isSelected ? '#FFFFFF' : colors.chartSecondary}
              stroke={colors.chartSecondary}
              strokeWidth={isSelected ? 2 : 1}
            />
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
