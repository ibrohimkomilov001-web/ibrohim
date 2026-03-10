"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";
import { CHART_COLORS } from "./chart-theme";

export interface PieRoseChartProps {
  data: { name: string; value: number }[];
  height?: number;
  className?: string;
  roseType?: "radius" | "area";
  showLabel?: boolean;
}

export function PieRoseChart({
  data,
  height = 300,
  className,
  roseType = "radius",
  showLabel = true,
}: PieRoseChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  const option = useMemo(() => {
    const coloredData = data.map((d, i) => ({
      ...d,
      itemStyle: {
        color: {
          type: "linear" as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: palette[i % palette.length] },
            { offset: 1, color: palette[i % palette.length] + "AA" },
          ],
        },
        shadowBlur: 6,
        shadowColor: "rgba(0,0,0,0.08)",
        borderColor: isDark ? "#111827" : "#FFFFFF",
        borderWidth: 2,
      },
    }));

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: { marker: string; name: string; value: number; percent: number }) =>
          `${params.marker} ${params.name}<br/>Soni: <b>${params.value}</b> (${params.percent}%)`,
      },
      legend: {
        show: true,
        bottom: 0,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: {
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: 11,
        },
      },
      series: [
        {
          type: "pie",
          roseType,
          radius: ["20%", "65%"],
          center: ["50%", "45%"],
          data: coloredData,
          label: {
            show: showLabel,
            color: isDark ? "#D1D5DB" : "#374151",
            fontSize: 11,
            formatter: "{b}: {d}%",
          },
          labelLine: {
            show: showLabel,
            lineStyle: { color: isDark ? "#4B5563" : "#D1D5DB" },
          },
          emphasis: {
            scaleSize: 8,
            label: { fontSize: 13, fontWeight: 600 },
          },
          animationType: "scale",
          animationEasing: "elasticOut",
          animationDuration: 1200,
          animationDelay: (idx: number) => idx * 100,
        },
      ],
    };
  }, [data, isDark, palette, roseType, showLabel]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
