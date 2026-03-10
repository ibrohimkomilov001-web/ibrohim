"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";

export interface GaugeChartProps {
  value: number;
  max?: number;
  label?: string;
  height?: number;
  className?: string;
  color?: string;
  suffix?: string;
}

export function GaugeChart({
  value,
  max = 100,
  label = "",
  height = 200,
  className,
  color,
  suffix = "%",
}: GaugeChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const defaultColor = isDark ? "#7B7FE0" : "#5B5FC7";
  const gaugeColor = color || defaultColor;

  const option = useMemo(() => {
    const ratio = value / max;
    const endAngle = -45 + (1 - ratio) * 0; // unused, kept for clarity

    return {
      series: [
        {
          type: "gauge",
          startAngle: 220,
          endAngle: -40,
          min: 0,
          max,
          pointer: { show: false },
          progress: {
            show: true,
            width: 14,
            roundCap: true,
            itemStyle: {
              color: {
                type: "linear",
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: gaugeColor },
                  { offset: 1, color: gaugeColor + "99" },
                ],
              },
            },
          },
          axisLine: {
            lineStyle: {
              width: 14,
              color: [[1, isDark ? "#1F2937" : "#F3F4F6"]],
            },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: { show: false },
          title: {
            show: true,
            offsetCenter: [0, "35%"],
            fontSize: 12,
            color: isDark ? "#9CA3AF" : "#6B7280",
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, "5%"],
            fontSize: 28,
            fontWeight: 700,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            formatter: `{value}${suffix}`,
            color: isDark ? "#F3F4F6" : "#111827",
          },
          data: [{ value, name: label }],
          animationDuration: 1200,
          animationEasing: "cubicOut",
        },
      ],
    };
  }, [value, max, label, gaugeColor, isDark, suffix]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
