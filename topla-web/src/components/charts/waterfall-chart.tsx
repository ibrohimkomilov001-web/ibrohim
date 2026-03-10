"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";
import { CHART_COLORS } from "./chart-theme";
import { formatNumber } from "@/lib/utils";

export interface WaterfallChartProps {
  data: { name: string; value: number; isTotal?: boolean }[];
  height?: number;
  className?: string;
  valueFormatter?: (val: number) => string;
}

export function WaterfallChart({
  data,
  height = 300,
  className,
  valueFormatter = (v) => formatNumber(v),
}: WaterfallChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  const option = useMemo(() => {
    const categories: string[] = [];
    const transparentData: number[] = [];
    const positiveData: (number | string)[] = [];
    const negativeData: (number | string)[] = [];

    let runningTotal = 0;

    data.forEach((d) => {
      categories.push(d.name);
      if (d.isTotal) {
        transparentData.push(0);
        positiveData.push(runningTotal > 0 ? runningTotal : "-");
        negativeData.push(runningTotal < 0 ? Math.abs(runningTotal) : "-");
      } else if (d.value >= 0) {
        transparentData.push(runningTotal);
        positiveData.push(d.value);
        negativeData.push("-");
        runningTotal += d.value;
      } else {
        runningTotal += d.value;
        transparentData.push(runningTotal);
        positiveData.push("-");
        negativeData.push(Math.abs(d.value));
      }
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: Array<{ dataIndex: number }>) => {
          const idx = params[0]?.dataIndex;
          if (idx == null) return "";
          const d = data[idx];
          const prefix = d.isTotal ? "Jami" : d.value >= 0 ? "+" : "";
          return `<b>${d.name}</b><br/>${prefix}${valueFormatter(d.value)}`;
        },
      },
      grid: {
        left: 8,
        right: 8,
        top: 16,
        bottom: 8,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: categories,
        axisLine: { lineStyle: { color: isDark ? "#374151" : "#E5E7EB" } },
        axisLabel: {
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: 11,
          rotate: categories.length > 6 ? 30 : 0,
        },
      },
      yAxis: {
        type: "value",
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
      },
      series: [
        {
          type: "bar",
          stack: "waterfall",
          itemStyle: { borderColor: "transparent", color: "transparent" },
          emphasis: { itemStyle: { borderColor: "transparent", color: "transparent" } },
          data: transparentData,
        },
        {
          type: "bar",
          stack: "waterfall",
          name: "Kirim",
          itemStyle: {
            color: palette[2],
            borderRadius: [4, 4, 0, 0],
          },
          label: {
            show: true,
            position: "top",
            formatter: (params: { value: number | string }) => {
              if (params.value === "-") return "";
              return "+" + valueFormatter(params.value as number);
            },
            color: isDark ? "#D1D5DB" : "#374151",
            fontSize: 10,
          },
          data: positiveData,
        },
        {
          type: "bar",
          stack: "waterfall",
          name: "Chiqim",
          itemStyle: {
            color: palette[4],
            borderRadius: [4, 4, 0, 0],
          },
          label: {
            show: true,
            position: "bottom",
            formatter: (params: { value: number | string }) => {
              if (params.value === "-") return "";
              return "-" + valueFormatter(params.value as number);
            },
            color: isDark ? "#D1D5DB" : "#374151",
            fontSize: 10,
          },
          data: negativeData,
        },
      ],
      animationDuration: 1000,
      animationEasing: "cubicOut",
    };
  }, [data, isDark, palette, valueFormatter]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
