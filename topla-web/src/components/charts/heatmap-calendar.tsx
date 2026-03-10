"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";

export interface HeatmapCalendarProps {
  data: { date: string; value: number }[];
  height?: number;
  className?: string;
  year?: number;
  valueLabel?: string;
}

export function HeatmapCalendar({
  data,
  height = 180,
  className,
  year,
  valueLabel = "Faollik",
}: HeatmapCalendarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const option = useMemo(() => {
    const calYear = year || new Date().getFullYear();
    const maxVal = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 10;

    return {
      tooltip: {
        formatter: (params: { value: [string, number]; marker: string }) => {
          if (!params.value) return "";
          return `${params.marker} ${params.value[0]}<br/>${valueLabel}: <b>${params.value[1]}</b>`;
        },
      },
      visualMap: {
        min: 0,
        max: maxVal,
        show: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        type: "continuous",
        calculable: false,
        itemWidth: 12,
        itemHeight: 100,
        textStyle: {
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: 10,
        },
        inRange: {
          color: isDark
            ? ["#1E293B", "#312E81", "#4338CA", "#6366F1", "#818CF8"]
            : ["#EEF2FF", "#C7D2FE", "#818CF8", "#6366F1", "#4338CA"],
        },
      },
      calendar: {
        top: 16,
        left: 40,
        right: 16,
        bottom: 36,
        cellSize: ["auto", 14],
        range: String(calYear),
        splitLine: { show: false },
        itemStyle: {
          borderWidth: 3,
          borderColor: isDark ? "#111827" : "#FFFFFF",
          borderRadius: 3,
          color: isDark ? "#1F2937" : "#F9FAFB",
        },
        dayLabel: {
          nameMap: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
          color: isDark ? "#6B7280" : "#9CA3AF",
          fontSize: 10,
        },
        monthLabel: {
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: 11,
        },
        yearLabel: { show: false },
      },
      series: [
        {
          type: "heatmap",
          coordinateSystem: "calendar",
          data: data.map((d) => [d.date, d.value]),
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: "rgba(0,0,0,0.15)",
            },
          },
          animationDuration: 1500,
        },
      ],
    };
  }, [data, isDark, year, valueLabel]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
