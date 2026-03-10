"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";

export interface CohortHeatmapProps {
  /** Row labels, typically cohort names like "Jan 2024", "Feb 2024" */
  cohorts: string[];
  /** Column labels, typically periods like "Month 0", "Month 1" */
  periods: string[];
  /** 2D array [cohortIndex][periodIndex] of values (0–100 for percentages) */
  data: number[][];
  height?: number;
  className?: string;
  valueLabel?: string;
  suffix?: string;
}

export function CohortHeatmap({
  cohorts,
  periods,
  data,
  height = 350,
  className,
  valueLabel = "Retention",
  suffix = "%",
}: CohortHeatmapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const option = useMemo(() => {
    const flatData: [number, number, number][] = [];
    let maxVal = 0;

    data.forEach((row, y) => {
      row.forEach((val, x) => {
        flatData.push([x, y, val]);
        if (val > maxVal) maxVal = val;
      });
    });

    return {
      tooltip: {
        formatter: (params: { value: [number, number, number]; marker: string }) => {
          if (!params.value) return "";
          const [x, y, val] = params.value;
          return `${params.marker} <b>${cohorts[y]}</b> → ${periods[x]}<br/>${valueLabel}: <b>${val}${suffix}</b>`;
        },
      },
      grid: {
        left: 8,
        right: 16,
        top: 16,
        bottom: 40,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: periods,
        splitArea: { show: false },
        axisLine: { lineStyle: { color: isDark ? "#374151" : "#E5E7EB" } },
        axisLabel: {
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: 11,
        },
      },
      yAxis: {
        type: "category",
        data: cohorts,
        splitArea: { show: false },
        axisLine: { lineStyle: { color: isDark ? "#374151" : "#E5E7EB" } },
        axisLabel: {
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: 11,
        },
      },
      visualMap: {
        min: 0,
        max: maxVal || 100,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemWidth: 12,
        itemHeight: 100,
        textStyle: {
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: 10,
        },
        inRange: {
          color: isDark
            ? ["#1E293B", "#1E3A5F", "#1D4ED8", "#3B82F6", "#60A5FA", "#93C5FD"]
            : ["#EFF6FF", "#DBEAFE", "#93C5FD", "#60A5FA", "#3B82F6", "#1D4ED8"],
        },
      },
      series: [
        {
          type: "heatmap",
          data: flatData,
          label: {
            show: true,
            color: isDark ? "#E5E7EB" : "#374151",
            fontSize: 11,
            formatter: (params: { value: [number, number, number] }) =>
              `${params.value[2]}${suffix}`,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0,0,0,0.2)",
            },
          },
          itemStyle: {
            borderColor: isDark ? "#111827" : "#FFFFFF",
            borderWidth: 2,
            borderRadius: 3,
          },
          animationDuration: 1500,
        },
      ],
    };
  }, [cohorts, periods, data, isDark, valueLabel, suffix]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
