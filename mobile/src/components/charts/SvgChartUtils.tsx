/**
 * Utilidades matemáticas, de formato y trazado SVG ultra-seguras para gráficos financieros nativos
 */

export function sanitizeNumber(val: any, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

export function formatXAxisLabel(period: string, index: number, total: number): string {
  if (!period) return '';
  const trimmed = period.trim();

  // Si hay más de 6 períodos (típico en trimestres):
  if (total > 7) {
    // Si es trimestral "Q1 2024" -> "Q1'24"
    if (trimmed.startsWith('Q')) {
      const formatted = trimmed.replace(/\s*20(\d\d)/, "'$1");
      // Mostrar cada 2 períodos para evitar solapamiento si son más de 8
      if (total >= 9 && index % 2 !== 0 && index !== total - 1) {
        return '';
      }
      return formatted;
    }
  } else if (total > 5) {
    if (trimmed.startsWith('Q')) {
      return trimmed.replace(/\s*20(\d\d)/, "'$1");
    }
  }

  return trimmed;
}

export function createLinePath(
  points: { x: number; y: number }[]
): string {
  if (!points || points.length === 0) return '';
  const validPoints = points.map(p => ({
    x: sanitizeNumber(p.x, 0),
    y: sanitizeNumber(p.y, 0),
  }));

  if (validPoints.length === 1) return `M ${validPoints[0].x.toFixed(1)} ${validPoints[0].y.toFixed(1)}`;

  let path = `M ${validPoints[0].x.toFixed(1)} ${validPoints[0].y.toFixed(1)}`;
  for (let i = 1; i < validPoints.length; i++) {
    path += ` L ${validPoints[i].x.toFixed(1)} ${validPoints[i].y.toFixed(1)}`;
  }
  return path;
}

export function createSmoothAreaPath(
  points: { x: number; y: number }[],
  bottomY: number
): string {
  if (!points || points.length < 2) return '';
  const safeBottom = sanitizeNumber(bottomY, 150);
  const linePath = createLinePath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const lastX = sanitizeNumber(lastPoint?.x, 0).toFixed(1);
  const firstX = sanitizeNumber(firstPoint?.x, 0).toFixed(1);
  return `${linePath} L ${lastX} ${safeBottom.toFixed(1)} L ${firstX} ${safeBottom.toFixed(1)} Z`;
}

export function formatCompactNumber(val: number): string {
  const safe = sanitizeNumber(val, 0);
  const abs = Math.abs(safe);
  if (abs >= 1000) return `${(safe / 1000).toFixed(1)}T`;
  if (abs >= 1) return `${safe.toFixed(1)}B`;
  return `${(safe * 1000).toFixed(0)}M`;
}

export function formatCurrency(val: number): string {
  const safe = sanitizeNumber(val, 0);
  return `$${safe.toFixed(2)}`;
}

export function formatPercentage(val: number): string {
  const safe = sanitizeNumber(val, 0);
  const sign = safe > 0 ? '+' : '';
  return `${sign}${safe.toFixed(1)}%`;
}
