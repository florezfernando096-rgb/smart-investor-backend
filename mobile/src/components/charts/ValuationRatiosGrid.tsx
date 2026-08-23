import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Rect, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { HistoricalRatiosData } from '../../types/dashboard';
import { createLinePath, createSmoothAreaPath, sanitizeNumber } from './SvgChartUtils';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  data: HistoricalRatiosData;
}

// Dimensiones relativas para SVG con viewBox adaptable a cualquier pantalla
const VB_WIDTH = 150;
const VB_HEIGHT = 80;
const PAD_L = 10;
const PAD_R = 18;
const PAD_T = 20;
const PAD_B = 18;

const MiniSparklineCard: React.FC<{
  title: string;
  years: string[];
  values: number[];
  color: string;
  gradientId: string;
  suffix?: string;
}> = ({ title, years, values, color, gradientId, suffix = '' }) => {
  const { colors, isDark } = useTheme();
  const safeYears = years || [];
  const safeValues = (values || []).map(v => sanitizeNumber(v, 0));

  if (safeValues.length === 0) return null;

  const minVal = Math.min(...safeValues);
  const maxVal = Math.max(...safeValues);
  const firstVal = safeValues[0];
  const lastVal = safeValues[safeValues.length - 1];

  // Margen vertical del 18% para que la curva tenga amplitud dinámica (soportando valores negativos)
  const diff = maxVal - minVal;
  const paddingY = diff > 0 ? diff * 0.18 : (Math.abs(maxVal) > 0 ? Math.abs(maxVal) * 0.15 : 1);
  const adjustedMin = minVal < 0 ? minVal - paddingY : Math.max(0, minVal - paddingY);
  const adjustedMax = maxVal + paddingY;
  const range = adjustedMax - adjustedMin || 1;

  const usableW = VB_WIDTH - PAD_L - PAD_R;
  const usableH = VB_HEIGHT - PAD_T - PAD_B;
  const count = safeValues.length;
  const stepX = count > 1 ? usableW / (count - 1) : 0;

  const points = safeValues.map((v, idx) => ({
    x: PAD_L + idx * stepX,
    y: PAD_T + usableH - ((v - adjustedMin) / range) * usableH,
  }));

  const linePath = createLinePath(points);
  const areaPath = createSmoothAreaPath(points, VB_HEIGHT - PAD_B);
  const lastPoint = points[points.length - 1] || { x: 0, y: 0 };

  // Tendencia respecto al primer valor
  const isUp = lastVal >= firstVal;
  const trendSymbol = isUp ? '↗' : '↘';
  const trendColor = isUp ? colors.positive : colors.negative;

  // Badge flotante con el último valor exacto
  const labelText = Number.isFinite(lastVal) ? `${lastVal.toFixed(1)}${suffix}` : '-';
  const badgeW = Math.max(30, labelText.length * 7 + 8);
  const badgeH = 16;
  const badgeX = Math.min(VB_WIDTH - badgeW - 2, Math.max(2, lastPoint.x - badgeW / 2));
  const badgeY = lastPoint.y < PAD_T + 12 ? lastPoint.y + 7 : lastPoint.y - badgeH - 5;
  const textY = badgeY + 11.5;

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
      className="w-[48.5%] rounded-2xl p-3 mb-3 border justify-between"
    >
      {/* Cabecera de la Tarjeta */}
      <View className="flex-row justify-between items-center mb-1">
        <Text
          style={{ color: colors.textSecondary }}
          className="text-[11px] font-bold uppercase tracking-wider"
          numberOfLines={1}
        >
          {title}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-[10px] font-extrabold mr-1" style={{ color: trendColor }}>
            {trendSymbol}
          </Text>
          <Text
            style={{ color: colors.textPrimary }}
            className="text-sm font-black tracking-tight"
          >
            {labelText}
          </Text>
        </View>
      </View>

      {/* Gráfico Sparkline SVG Adaptable al 100% de la Tarjeta */}
      <Svg width="100%" height={VB_HEIGHT} viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={isDark ? 0.45 : 0.25} />
            <Stop offset="70%" stopColor={color} stopOpacity={isDark ? 0.08 : 0.03} />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Línea Base */}
        <Line
          x1={PAD_L}
          y1={VB_HEIGHT - PAD_B}
          x2={VB_WIDTH - PAD_R}
          y2={VB_HEIGHT - PAD_B}
          stroke={colors.gridLine}
          strokeWidth={1}
        />

        {/* Área Sombreada con Gradiente */}
        <Path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Línea Principal de Tendencia */}
        <Path d={linePath} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />

        {/* Puntos Intermedios sutiles */}
        {points.map((pt, pIdx) => (
          <Circle
            key={`pt-sub-${pIdx}`}
            cx={pt.x}
            cy={pt.y}
            r={2}
            fill={color}
            opacity={0.7}
          />
        ))}

        {/* Destacado del Último Punto */}
        {points.length > 0 && (
          <G>
            {/* Halo exterior */}
            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={6}
              fill={color}
              opacity={0.35}
            />
            {/* Punto interior blanco */}
            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={3.2}
              fill="#ffffff"
              stroke={color}
              strokeWidth={2}
            />
          </G>
        )}

        {/* Etiqueta flotante con el último valor dentro de la gráfica */}
        {points.length > 0 && (
          <G>
            <Rect
              x={badgeX}
              y={badgeY}
              width={badgeW}
              height={badgeH}
              rx={4}
              fill="#1E293B"
              stroke={color}
              strokeWidth={1.2}
            />
            <SvgText
              x={badgeX + badgeW / 2}
              y={textY}
              fontSize="9"
              fontWeight="bold"
              fill="#FFFFFF"
              textAnchor="middle"
            >
              {labelText}
            </SvgText>
          </G>
        )}

        {/* Fechas Extremos en Eje X */}
        <SvgText
          x={PAD_L}
          y={VB_HEIGHT - 3}
          fontSize="8.5"
          fontWeight="bold"
          fill={colors.textSecondary}
          textAnchor="start"
        >
          {safeYears[0] || ''}
        </SvgText>
        <SvgText
          x={VB_WIDTH - PAD_R}
          y={VB_HEIGHT - 3}
          fontSize="8.5"
          fontWeight="bold"
          fill={colors.textSecondary}
          textAnchor="end"
        >
          {safeYears[safeYears.length - 1] || ''}
        </SvgText>
      </Svg>
    </View>
  );
};

export const ValuationRatiosGrid: React.FC<Props> = ({ data }) => {
  const { colors } = useTheme();
  const years = data?.years || [];

  return (
    <View className="flex-row flex-wrap justify-between w-full">
      <MiniSparklineCard
        title="P/E Ratio"
        years={years}
        values={data?.pe_ratio?.data || []}
        color={colors.chartPrimary}
        gradientId="grad_pe"
        suffix="x"
      />
      <MiniSparklineCard
        title="P/S Ratio"
        years={years}
        values={data?.ps_ratio?.data || []}
        color={colors.chartPurple}
        gradientId="grad_ps"
        suffix="x"
      />
      <MiniSparklineCard
        title="P/B Ratio"
        years={years}
        values={data?.pb_ratio?.data || []}
        color="#a855f7"
        gradientId="grad_pb"
        suffix="x"
      />
      <MiniSparklineCard
        title="P/FCF Ratio"
        years={years}
        values={data?.pfcf_ratio?.data || []}
        color={colors.chartSecondary}
        gradientId="grad_pfcf"
        suffix="x"
      />
      <MiniSparklineCard
        title="EV / EBITDA"
        years={years}
        values={data?.ev_ebitda?.data || []}
        color={colors.chartTertiary}
        gradientId="grad_evebitda"
        suffix="x"
      />
      <MiniSparklineCard
        title="EV / Sales"
        years={years}
        values={data?.ev_sales?.data || []}
        color="#ea580c"
        gradientId="grad_evsales"
        suffix="x"
      />
      <MiniSparklineCard
        title="Div Yield"
        years={years}
        values={data?.dividend_yield?.data || []}
        color={colors.chartTeal}
        gradientId="grad_divyield"
        suffix="%"
      />
      <MiniSparklineCard
        title="Debt / Equity"
        years={years}
        values={data?.debt_equity?.data || []}
        color={colors.negative}
        gradientId="grad_debtequity"
        suffix="x"
      />
    </View>
  );
};
