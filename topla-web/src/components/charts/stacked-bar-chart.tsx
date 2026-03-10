"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";
import { CHART_COLORS } from "./chart-theme";
import { formatNumber } from "@/lib/utils";

export interface StackedBarChartProps {
  categories: string[];
  series: { name: string; data: number[] }[];
  height?: number;
  className?: string;
  horizontal?: boolean;
  valueFormatter?: (val: number) => string;
  grouped?: boolean;
}

export function StackedBarChart({
  categories,
  series,
  height = 300,
  className,
  horizontal = false,
  valueFormatter = (v) => formatNumber(v),
  grouped = false,
}: StackedBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  const option = useMemo(() => {
    const categoryAxis = {
      type: "category" as const,
      data: categories,
      axisLine: { lineStyle: { color: isDark ? "#374151" : "#E5E7EB" } },
      axisLabel: {
        color: isDark ? "#9CA3AF" : "#6B7280",
        fontSize: 11,
        rotate: !horizontal && categories.length > 8 ? 30 : 0,
      },
      axisTick: { show: false },
    };

    const valueAxis = {
      type: "value" as const,
      splitLine: { lineStyle: { color: isDark ? "#1F2937" : "#F3F4F6" } },
      axisLabel: {
        color: isDark ? "#9CA3AF" : "#6B7280",
        fontSize: 11,
        formatter: (v: number) => {
          if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "M";
          if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + "K";
          return String(v);
        },
      },
    };

    const chartSeries = series.map((s, i) => ({
      type: "bar" as const,
      name: s.name,
      stack: grouped ? undefined : "stack",
      data: s.data,
      barMaxWidth: 40,
      barGap: grouped ? "20%" : undefined,
      itemStyle: {
        color: {
          type: "linear" as const,
          x: horizontal ? 0 : 0,
          y: horizontal ? 0 : 1,
          x2: horizontal ? 1 : 0,
          y2: 0,
          colorStops: [
            { offset: 0, color: palette[i % palette.length] + "BB" },
            { offset: 1, color: palette[i % palette.length] },
          ],
        },
        borderRadius: grouped ? [4, 4, 4, 4] : i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0],
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 8,
          shadowColor: "rgba(0,0,0,0.12)",
        },
      },
      animationDelay: (idx: number) => idx * 50 + i * 100,
    }));

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: Array<{ marker: string; seriesName: string; value: number }>) => {
          let html = `<b>${params[0]?.seriesName ? (categories[0] || "") : ""}</b>`;
          if (params.length > 0 && "axisValue" in params[0]) {
            html = `<b>${(params[0] as unknown as { axisValue: string }).axisValue}</b>`;
          }
          let total = 0;
          params.forEach((p) => {
            html += `<br/>${p.marker} ${p.seriesName}: <b>${valueFormatter(p.value)}</b>`;
            total += p.value;
          });
          if (!grouped && params.length > 1) {
            html += `<br/><br/>Jami: <b>${valueFormatter(total)}</b>`;
          }
          return html;
        },
      },
      legend: {
        show: series.length > 1,
        bottom: 0,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { color: isDark ? "#9CA3AF" : "#6B7280", fontSize: 11 },
      },
      grid: {
        left: 8,
        right: 8,
        top: 16,
        bottom: series.length > 1 ? 40 : 8,
        containLabel: true,
      },
      xAxis: horizontal ? valueAxis : categoryAxis,
      yAxis: horizontal ? categoryAxis : valueAxis,
      series: chartSeries,
      animationDuration: 1000,
      animationEasing: "cubicOut",
    };
  }, [categories, series, isDark, palette, horizontal, valueFormatter, grouped]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
