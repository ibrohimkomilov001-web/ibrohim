"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";
import { CHART_COLORS } from "./chart-theme";

export interface RadarChartProps {
  indicators: { name: string; max?: number }[];
  data: { name: string; values: number[] }[];
  height?: number;
  className?: string;
}

export function RadarChart({ indicators, data, height = 300, className }: RadarChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  const option = useMemo(() => {
    const indicator = indicators.map((ind) => ({
      name: ind.name,
      max: ind.max || Math.max(...data.flatMap((d) => d.values)) * 1.2,
    }));

    const series = data.map((d, i) => ({
      name: d.name,
      value: d.values,
      lineStyle: { color: palette[i % palette.length], width: 2 },
      areaStyle: { color: palette[i % palette.length] + "25" },
      itemStyle: { color: palette[i % palette.length] },
      symbol: "circle",
      symbolSize: 6,
    }));

    return {
      tooltip: {
        trigger: "item",
      },
      legend: {
        show: data.length > 1,
        bottom: 0,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
      },
      radar: {
        indicator,
        shape: "polygon",
        radius: "65%",
        center: ["50%", data.length > 1 ? "45%" : "50%"],
        splitNumber: 4,
        axisName: {
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: isDark ? "#374151" : "#E5E7EB" },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: isDark
              ? ["rgba(99,102,241,0.04)", "rgba(99,102,241,0.02)"]
              : ["rgba(99,102,241,0.04)", "rgba(99,102,241,0.01)"],
          },
        },
        axisLine: {
          lineStyle: { color: isDark ? "#374151" : "#E5E7EB" },
        },
      },
      series: [
        {
          type: "radar",
          data: series,
          animationDuration: 1000,
          animationEasing: "cubicOut",
        },
      ],
    };
  }, [indicators, data, isDark, palette]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
