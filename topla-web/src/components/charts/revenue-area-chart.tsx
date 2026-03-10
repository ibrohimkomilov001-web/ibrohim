"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";
import { CHART_COLORS, getAreaGradient } from "./chart-theme";
import { formatPrice, formatNumber } from "@/lib/utils";

export interface RevenueAreaChartProps {
  data: { date: string; revenue: number; orders?: number }[];
  compareData?: { date: string; revenue: number; orders?: number }[];
  height?: number;
  className?: string;
  valueFormatter?: (v: number) => string;
  showOrders?: boolean;
}

export function RevenueAreaChart({
  data,
  compareData,
  height = 320,
  className,
  valueFormatter = formatPrice,
  showOrders = false,
}: RevenueAreaChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  const option = useMemo(() => {
    const series: unknown[] = [
      {
        name: "Daromad",
        type: "line",
        data: data.map((d) => d.revenue),
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: false,
        emphasis: { focus: "series", itemStyle: { shadowBlur: 10 } },
        lineStyle: { width: 3, color: palette[0] },
        areaStyle: {
          color: getAreaGradient(palette[0], 0.2),
        },
        animationDelay: 0,
      },
    ];

    if (compareData?.length) {
      series.push({
        name: "Oldingi davr",
        type: "line",
        data: compareData.map((d) => d.revenue),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, type: "dashed", color: isDark ? "#6B7280" : "#D1D5DB" },
        areaStyle: null,
        animationDelay: 300,
      });
    }

    if (showOrders && data.some((d) => d.orders)) {
      series.push({
        name: "Buyurtmalar",
        type: "bar",
        yAxisIndex: 1,
        data: data.map((d) => d.orders || 0),
        barMaxWidth: 20,
        itemStyle: {
          color: getAreaGradient(palette[1], 0.6),
          borderRadius: [4, 4, 0, 0],
        },
        animationDelay: 150,
      });
    }

    const yAxes: unknown[] = [
      {
        type: "value",
        axisLabel: {
          formatter: (v: number) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return String(v);
          },
        },
        splitNumber: 4,
      },
    ];

    if (showOrders) {
      yAxes.push({
        type: "value",
        axisLabel: { formatter: (v: number) => formatNumber(v) },
        splitLine: { show: false },
        splitNumber: 4,
      });
    }

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: Array<{ seriesName: string; value: number; marker: string; axisValueLabel: string }>) => {
          if (!Array.isArray(params) || !params.length) return "";
          let html = `<div class="font-medium mb-1">${params[0].axisValueLabel}</div>`;
          params.forEach((p) => {
            const val = p.seriesName === "Buyurtmalar" ? formatNumber(p.value) : valueFormatter(p.value);
            html += `<div class="flex items-center gap-2 text-sm">${p.marker} <span class="opacity-70">${p.seriesName}:</span> <b>${val}</b></div>`;
          });
          return html;
        },
      },
      legend: {
        show: !!compareData?.length || showOrders,
        bottom: 0,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 4,
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.date),
        boundaryGap: showOrders ? true : false,
      },
      yAxis: yAxes,
      series,
    };
  }, [data, compareData, isDark, palette, valueFormatter, showOrders]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
