import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { sanitizeNumber, formatXAxisLabel } from './SvgChartUtils';
import { useTheme } from '../../context/ThemeContext';

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
  positiveColor,
  negativeColor,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const posCol = positiveColor || colors.positive;
  const negCol = negativeColor || colors.negative;

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

      {/* 2. Leyendas / Unidad en Fila Separada */}
      <View className="flex-row items-center justify-between mb-2 flex-wrap">
        <View
          style={{
            backgroundColor: colors.pillBg,
            borderColor: colors.pillBorder,
          }}
          className="px-2 py-0.5 rounded-md border"
        >
          <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold">
            {`Unidad: ${unit}`}
          </Text>
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
          stroke={colors.gridLine}
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
              fill={isPos ? posCol : negCol}
              opacity={isSelected ? 1 : 0.85}
            />
          );
        })}

        {/* Etiquetas Eje X */}
        {safePeriods.map((period, idx) => {
          const isSelected = selectedIndex === idx;
          const x = PADDING_LEFT + idx * colWidth + colWidth / 2;
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
