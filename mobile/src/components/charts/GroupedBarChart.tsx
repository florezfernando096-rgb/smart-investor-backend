import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { sanitizeNumber, formatXAxisLabel } from './SvgChartUtils';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  title: string;
  periods: string[];
  series1: { label: string; values: number[]; color: string };
  series2: { label: string; values: number[]; color: string };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 56;
const CHART_HEIGHT = 175;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 28;
const PADDING_LEFT = 20;
const PADDING_RIGHT = 20;

export const GroupedBarChart: React.FC<Props> = ({
  title,
  periods,
  series1,
  series2,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const safePeriods = periods || [];
  const s1Vals = (series1?.values || []).map(v => sanitizeNumber(v, 0));
  const s2Vals = (series2?.values || []).map(v => sanitizeNumber(v, 0));

  if (safePeriods.length === 0 || (s1Vals.length === 0 && s2Vals.length === 0)) return null;

  const allVals = [...s1Vals, ...s2Vals];
  const maxVal = Math.max(...allVals, 10);

  const usableWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const count = safePeriods.length;
  const groupWidth = usableWidth / count;
  const singleBarWidth = Math.min(12, groupWidth * 0.38);

  const activePeriod = selectedIndex !== null ? safePeriods[selectedIndex] : null;
  const activeV1 = selectedIndex !== null ? s1Vals[selectedIndex] : null;
  const activeV2 = selectedIndex !== null ? s2Vals[selectedIndex] : null;

  const c1 = series1?.color || colors.chartPrimary;
  const c2 = series2?.color || colors.chartPurple;

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
        <View className="flex-row items-center">
          <View
            style={{
              backgroundColor: colors.pillBg,
              borderColor: colors.pillBorder,
            }}
            className="flex-row items-center mr-3 px-2 py-0.5 rounded-md border"
          >
            <View className="w-2 h-2 rounded-sm mr-1.5" style={{ backgroundColor: c1 }} />
            <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold">
              {series1?.label || 'Serie 1'}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.pillBg,
              borderColor: colors.pillBorder,
            }}
            className="flex-row items-center px-2 py-0.5 rounded-md border"
          >
            <View className="w-2 h-2 rounded-sm mr-1.5" style={{ backgroundColor: c2 }} />
            <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold">
              {series2?.label || 'Serie 2'}
            </Text>
          </View>
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
              {`${activePeriod}: ${activeV1?.toFixed(1)} | ${activeV2?.toFixed(1)}`}
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

        {safePeriods.map((_, idx) => {
          const isSelected = selectedIndex === idx;
          const v1 = s1Vals[idx] || 0;
          const v2 = s2Vals[idx] || 0;
          const h1 = (v1 / maxVal) * usableHeight;
          const h2 = (v2 / maxVal) * usableHeight;

          const groupCenterX = PADDING_LEFT + idx * groupWidth + groupWidth / 2;
          const x1 = groupCenterX - singleBarWidth - 1;
          const x2 = groupCenterX + 1;

          return (
            <React.Fragment key={`grp-${idx}`}>
              {/* Barra 1 */}
              <Rect
                x={x1}
                y={PADDING_TOP + usableHeight - h1}
                width={singleBarWidth}
                height={Math.max(2, h1)}
                rx={2.5}
                fill={c1}
                opacity={isSelected ? 1 : 0.85}
              />
              {/* Barra 2 */}
              <Rect
                x={x2}
                y={PADDING_TOP + usableHeight - h2}
                width={singleBarWidth}
                height={Math.max(2, h2)}
                rx={2.5}
                fill={c2}
                opacity={isSelected ? 1 : 0.85}
              />
              {/* Etiqueta X */}
              <SvgText
                x={groupCenterX}
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
