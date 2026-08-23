import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { sanitizeNumber, formatXAxisLabel } from './SvgChartUtils';

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

  return (
    <View className="bg-[#0f172a] rounded-2xl p-3.5 mb-3 border border-slate-800 shadow-md">
      {/* 1. Título */}
      <Text className="text-xs font-black text-slate-200 mb-1.5">{title}</Text>

      {/* 2. Leyendas en Fila Separada */}
      <View className="flex-row items-center justify-between mb-2 flex-wrap">
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-3 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
            <View className="w-2 h-2 rounded-sm mr-1.5" style={{ backgroundColor: series1?.color || '#38bdf8' }} />
            <Text className="text-[10px] font-semibold text-slate-400">{series1?.label || 'Serie 1'}</Text>
          </View>
          <View className="flex-row items-center bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
            <View className="w-2 h-2 rounded-sm mr-1.5" style={{ backgroundColor: series2?.color || '#10b981' }} />
            <Text className="text-[10px] font-semibold text-slate-400">{series2?.label || 'Serie 2'}</Text>
          </View>
        </View>

        {/* Tooltip con Valor Seleccionado */}
        {activePeriod && (
          <View className="bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
            <Text className="text-[10px] font-bold text-indigo-300">
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
          stroke="#334155"
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
                y={CHART_HEIGHT - PADDING_BOTTOM - h1}
                width={singleBarWidth}
                height={Math.max(2, h1)}
                rx={2}
                fill={series1?.color || '#38bdf8'}
                opacity={isSelected ? 1 : 0.85}
              />
              {/* Barra 2 */}
              <Rect
                x={x2}
                y={CHART_HEIGHT - PADDING_BOTTOM - h2}
                width={singleBarWidth}
                height={Math.max(2, h2)}
                rx={2}
                fill={series2?.color || '#10b981'}
                opacity={isSelected ? 1 : 0.85}
              />
            </React.Fragment>
          );
        })}

        {safePeriods.map((period, idx) => {
          const label = formatXAxisLabel(period, idx, count);
          if (!label) return null;
          const x = PADDING_LEFT + idx * groupWidth + groupWidth / 2;
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
            style={{ width: groupWidth, height: usableHeight }}
            onPress={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
            activeOpacity={0.6}
          />
        ))}
      </View>
    </View>
  );
};
