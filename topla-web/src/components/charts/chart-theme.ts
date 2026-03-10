/**
 * TOPLA ECharts Theme — Professional Light & Dark themes
 * Brand colors based on CSS custom properties from globals.css
 */

// 12-color palette for multi-series charts
const PALETTE_LIGHT = [
  '#5B5FC7', // primary (indigo-blue)
  '#8B5CF6', // accent (violet)
  '#10B981', // success (emerald)
  '#F59E0B', // warning (amber)
  '#EF4444', // destructive (red)
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#A855F7', // purple
  '#84CC16', // lime
];

const PALETTE_DARK = [
  '#7B7FE0', // primary lighter
  '#A78BFA', // accent lighter
  '#34D399', // success lighter
  '#FBBF24', // warning lighter
  '#F87171', // destructive lighter
  '#22D3EE', // cyan lighter
  '#F472B6', // pink lighter
  '#FB923C', // orange lighter
  '#818CF8', // indigo lighter
  '#2DD4BF', // teal lighter
  '#C084FC', // purple lighter
  '#A3E635', // lime lighter
];

export const CHART_COLORS = { light: PALETTE_LIGHT, dark: PALETTE_DARK };

// Gradient helpers for area/bar charts
export function getAreaGradient(color: string, opacity = 0.25) {
  return {
    type: 'linear' as const,
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: color + Math.round(opacity * 255).toString(16).padStart(2, '0') },
      { offset: 1, color: color + '05' },
    ],
  };
}

export const TOPLA_THEME_LIGHT = {
  color: PALETTE_LIGHT,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'var(--font-inter), Inter, -apple-system, system-ui, sans-serif',
    color: '#374151',
  },
  title: {
    textStyle: { fontWeight: 600, color: '#111827', fontSize: 16 },
    subtextStyle: { color: '#6B7280', fontSize: 13 },
  },
  legend: {
    textStyle: { color: '#6B7280', fontSize: 12 },
    pageTextStyle: { color: '#6B7280' },
    pageIconColor: '#6B7280',
    pageIconInactiveColor: '#D1D5DB',
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    textStyle: { color: '#111827', fontSize: 13 },
    extraCssText: 'border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.12); backdrop-filter: blur(12px); padding: 12px 16px;',
  },
  axisPointer: {
    lineStyle: { color: '#D1D5DB', type: 'dashed' as const },
    crossStyle: { color: '#D1D5DB' },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#E5E7EB' } },
    axisTick: { lineStyle: { color: '#E5E7EB' } },
    axisLabel: { color: '#9CA3AF', fontSize: 11 },
    splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' as const } },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#9CA3AF', fontSize: 11 },
    splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' as const } },
  },
  grid: {
    left: 8, right: 8, top: 32, bottom: 8,
    containLabel: true,
  },
  line: {
    symbol: 'circle',
    symbolSize: 6,
    smooth: true,
    lineStyle: { width: 2.5 },
  },
  bar: {
    barMaxWidth: 32,
    itemStyle: { borderRadius: [6, 6, 0, 0] },
  },
  pie: {
    itemStyle: { borderWidth: 2, borderColor: '#FFFFFF' },
  },
};

export const TOPLA_THEME_DARK = {
  color: PALETTE_DARK,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'var(--font-inter), Inter, -apple-system, system-ui, sans-serif',
    color: '#D1D5DB',
  },
  title: {
    textStyle: { fontWeight: 600, color: '#F3F4F6', fontSize: 16 },
    subtextStyle: { color: '#9CA3AF', fontSize: 13 },
  },
  legend: {
    textStyle: { color: '#9CA3AF', fontSize: 12 },
    pageTextStyle: { color: '#9CA3AF' },
    pageIconColor: '#9CA3AF',
    pageIconInactiveColor: '#4B5563',
  },
  tooltip: {
    backgroundColor: 'rgba(17, 24, 39, 0.96)',
    borderColor: '#374151',
    borderWidth: 1,
    textStyle: { color: '#F3F4F6', fontSize: 13 },
    extraCssText: 'border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.45); backdrop-filter: blur(12px); padding: 12px 16px;',
  },
  axisPointer: {
    lineStyle: { color: '#4B5563', type: 'dashed' as const },
    crossStyle: { color: '#4B5563' },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#374151' } },
    axisTick: { lineStyle: { color: '#374151' } },
    axisLabel: { color: '#6B7280', fontSize: 11 },
    splitLine: { lineStyle: { color: '#1F2937', type: 'dashed' as const } },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#6B7280', fontSize: 11 },
    splitLine: { lineStyle: { color: '#1F2937', type: 'dashed' as const } },
  },
  grid: {
    left: 8, right: 8, top: 32, bottom: 8,
    containLabel: true,
  },
  line: {
    symbol: 'circle',
    symbolSize: 6,
    smooth: true,
    lineStyle: { width: 2.5 },
  },
  bar: {
    barMaxWidth: 32,
    itemStyle: { borderRadius: [6, 6, 0, 0] },
  },
  pie: {
    itemStyle: { borderWidth: 2, borderColor: '#111827' },
  },
};
