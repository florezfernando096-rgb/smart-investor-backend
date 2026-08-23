import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { HistoricalRatiosData } from '../../types/dashboard';
import { createLinePath, createSmoothAreaPath, sanitizeNumber } from './SvgChartUtils';

interface Props {
  data: HistoricalRatiosData;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CHART_H = 55;
const PAD_L = 4;
const PAD_R = 4;
const PAD_T = 6;
const PAD_B = 14;

const MiniSparklineCard: React.FC<{
  title: string;
  years: string[];
  values: number[];
  color: string;
  gradientId: string;
  suffix?: string;
}> = ({ title, years, values, color, gradientId, suffix = '' }) => {
  const safeYears = years || [];
  const safeValues = (values || []).map(v => sanitizeNumber(v, 0));

  if (safeValues.length === 0) return null;

  const minVal = Math.min(...safeValues);
  const maxVal = Math.max(...safeValues);
  const range = maxVal - minVal || 1;
  const lastVal = safeValues[safeValues.length - 1];

  const usableW = CARD_WIDTH - 24 - PAD_L - PAD_R;
  const usableH = CHART_H - PAD_T - PAD_B;
  const count = safeValues.length;
  const stepX = count > 1 ? usableW / (count - 1) : 0;

  const points = safeValues.map((v, idx) => ({
    x: PAD_L + idx * stepX,
    y: PAD_T + usableH - ((v - minVal) / range) * usableH,
  }));

  const linePath = createLinePath(points);
  const areaPath = createSmoothAreaPath(points, CHART_H - PAD_B);
  const lastPoint = points[points.length - 1] || { x: 0, y: 0 };

  return (
    <View
      style={{ width: CARD_WIDTH }}
      className="bg-[#0f172a] rounded-2xl p-3 mb-2.5 border border-slate-800 shadow-sm justify-between"
    >
      {/* Cabecera de la Tarjeta */}
      <View className="flex-row justify-between items-baseline mb-1">
        <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-base font-black text-white tracking-tight">
          {Number.isFinite(lastVal) ? `${lastVal.toFixed(1)}${suffix}` : '-'}
        </Text>
      </View>

      {/* Mini Gráfico SVG con Gradiente */}
      <Svg width={CARD_WIDTH - 24} height={CHART_H}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Línea Base */}
        <Line
          x1={PAD_L}
          y1={CHART_H - PAD_B}
          x2={CARD_WIDTH - 24 - PAD_R}
          y2={CHART_H - PAD_B}
          stroke="#1e293b"
          strokeWidth={0.8}
        />

        {/* Área Sombreada y Línea */}
        <Path d={areaPath} fill={`url(#${gradientId})`} />
        <Path d={linePath} fill="none" stroke={color} strokeWidth={2} />

        {/* Punto final */}
        {points.length > 0 && (
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={3}
            fill="#ffffff"
            stroke={color}
            strokeWidth={1.5}
          />
        )}

        {/* Fechas Extremos */}
        <SvgText
          x={PAD_L}
          y={CHART_H - 2}
          fontSize="7.5"
          fill="#64748b"
          textAnchor="start"
        >
          {safeYears[0] || ''}
        </SvgText>
        <SvgText
          x={CARD_WIDTH - 24 - PAD_R}
          y={CHART_H - 2}
          fontSize="7.5"
          fill="#64748b"
          textAnchor="end"
        >
          {safeYears[safeYears.length - 1] || ''}
        </SvgText>
      </Svg>
    </View>
  );
};

export const ValuationRatiosGrid: React.FC<Props> = ({ data }) => {
  const years = data?.years || [];

  return (
    <View className="flex-row flex-wrap justify-between">
      <MiniSparklineCard
        title="P/E Ratio"
        years={years}
        values={data?.pe_ratio?.data || []}
        color="#38bdf8"
        gradientId="grad_pe"
        suffix="x"
      />
      <MiniSparklineCard
        title="P/S Ratio"
        years={years}
        values={data?.ps_ratio?.data || []}
        color="#818cf8"
        gradientId="grad_ps"
        suffix="x"
      />
      <MiniSparklineCard
        title="P/B Ratio"
        years={years}
        values={data?.pb_ratio?.data || []}
        color="#c084fc"
        gradientId="grad_pb"
        suffix="x"
      />
      <MiniSparklineCard
        title="P/FCF Ratio"
        years={years}
        values={data?.pfcf_ratio?.data || []}
        color="#34d399"
        gradientId="grad_pfcf"
        suffix="x"
      />
      <MiniSparklineCard
        title="EV / EBITDA"
        years={years}
        values={data?.ev_ebitda?.data || []}
        color="#fbbf24"
        gradientId="grad_evebitda"
        suffix="x"
      />
      <MiniSparklineCard
        title="EV / Sales"
        years={years}
        values={data?.ev_sales?.data || []}
        color="#fb923c"
        gradientId="grad_evsales"
        suffix="x"
      />
      <MiniSparklineCard
        title="Div Yield"
        years={years}
        values={data?.dividend_yield?.data || []}
        color="#2dd4bf"
        gradientId="grad_divyield"
        suffix="%"
      />
      <MiniSparklineCard
        title="Debt / Equity"
        years={years}
        values={data?.debt_equity?.data || []}
        color="#f87171"
        gradientId="grad_debtequity"
        suffix="x"
      />
    </View>
  );
};
