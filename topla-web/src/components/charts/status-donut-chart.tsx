"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";
import { CHART_COLORS } from "./chart-theme";
import { formatNumber } from "@/lib/utils";

export interface StatusDonutChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  className?: string;
  centerLabel?: string;
  centerValue?: string | number;
  innerRadius?: string;
  outerRadius?: string;
}

const STATUS_COLORS_LIGHT: Record<string, string> = {
  pending: "#F59E0B",
  processing: "#3B82F6",
  ready_for_pickup: "#8B5CF6",
  courier_assigned: "#6366F1",
  courier_picked_up: "#8B5CF6",
  shipping: "#06B6D4",
  at_pickup_point: "#A855F7",
  delivered: "#10B981",
  cancelled: "#EF4444",
  returned: "#F97316",
  active: "#10B981",
  inactive: "#9CA3AF",
  blocked: "#EF4444",
  draft: "#9CA3AF",
  approved: "#10B981",
  rejected: "#EF4444",
  on_review: "#F59E0B",
};

const STATUS_COLORS_DARK: Record<string, string> = {
  pending: "#FBBF24",
  processing: "#60A5FA",
  ready_for_pickup: "#A78BFA",
  courier_assigned: "#818CF8",
  courier_picked_up: "#A78BFA",
  shipping: "#22D3EE",
  at_pickup_point: "#C084FC",
  delivered: "#34D399",
  cancelled: "#F87171",
  returned: "#FB923C",
  active: "#34D399",
  inactive: "#9CA3AF",
  blocked: "#F87171",
  draft: "#9CA3AF",
  approved: "#34D399",
  rejected: "#F87171",
  on_review: "#FBBF24",
};

export function StatusDonutChart({
  data,
  height = 260,
  className,
  centerLabel,
  centerValue,
  innerRadius = "58%",
  outerRadius = "80%",
}: StatusDonutChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? CHART_COLORS.dark : CHART_COLORS.light;
  const statusColors = isDark ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT;

  const option = useMemo(() => {
    const total = data.reduce((s, d) => s + d.value, 0);

    const coloredData = data.map((d, i) => ({
      ...d,
      itemStyle: {
        color: d.color || statusColors[d.name.toLowerCase().replace(/\s+/g, "_")] || palette[i % palette.length],
      },
    }));

    const graphic = centerValue != null
      ? [
          {
            type: "group",
            left: "center",
            top: "center",
            children: [
              {
                type: "text",
                style: {
                  text: String(centerValue),
                  fontSize: 26,
                  fontWeight: 700,
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fill: isDark ? "#F3F4F6" : "#111827",
                  textAlign: "center",
                },
                left: "center",
                top: -14,
              },
              {
                type: "text",
                style: {
                  text: centerLabel || "Jami",
                  fontSize: 12,
                  fill: isDark ? "#9CA3AF" : "#6B7280",
                  textAlign: "center",
                },
                left: "center",
                top: 14,
              },
            ],
          },
        ]
      : [];

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: { name: string; value: number; percent: number; marker: string }) =>
          `${params.marker} ${params.name}: <b>${formatNumber(params.value)}</b> (${params.percent}%)`,
      },
      legend: {
        type: "scroll",
        orient: "horizontal",
        bottom: 0,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 12,
        textStyle: { fontSize: 11 },
      },
      graphic,
      series: [
        {
          type: "pie",
          radius: [innerRadius, outerRadius],
          center: ["50%", "45%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderWidth: 2,
            borderColor: isDark ? "#111827" : "#FFFFFF",
          },
          label: { show: false },
          emphasis: {
            scaleSize: 8,
            itemStyle: {
              shadowBlur: 20,
              shadowColor: "rgba(0,0,0,0.15)",
            },
          },
          data: coloredData,
          animationType: "scale",
          animationEasing: "elasticOut",
          animationDelay: (_idx: number) => _idx * 80,
        },
      ],
    };
  }, [data, isDark, palette, statusColors, centerLabel, centerValue, innerRadius, outerRadius]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
