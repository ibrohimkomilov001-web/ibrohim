"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";

export interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function SparklineChart({ data, color = "#5B5FC7", height = 40, className }: SparklineChartProps) {
  const { resolvedTheme } = useTheme();

  const option = useMemo(() => ({
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: {
      type: "category" as const,
      show: false,
      data: data.map((_, i) => i),
      boundaryGap: false,
    },
    yAxis: {
      type: "value" as const,
      show: false,
      min: Math.min(...data) * 0.9,
    },
    tooltip: { show: false },
    series: [
      {
        type: "line" as const,
        data,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + "30" },
              { offset: 1, color: color + "05" },
            ],
          },
        },
      },
    ],
    animation: true,
    animationDuration: 800,
    animationEasing: "cubicOut" as const,
  }), [data, color]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
