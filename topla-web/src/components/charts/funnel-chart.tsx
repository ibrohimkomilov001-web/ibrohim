"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";
import { CHART_COLORS } from "./chart-theme";
import { formatNumber } from "@/lib/utils";

export interface FunnelChartProps {
  data: { name: string; value: number; percentage?: number }[];
  height?: number;
  className?: string;
  showDropOff?: boolean;
}

export function FunnelChart({
  data,
  height = 300,
  className,
  showDropOff = true,
}: FunnelChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  const option = useMemo(() => {
    const maxVal = data.length > 0 ? data[0].value : 1;

    const funnelData = data.map((d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: {
        color: {
          type: "linear" as const,
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: palette[i % palette.length] },
            { offset: 1, color: palette[i % palette.length] + "CC" },
          ],
        },
        borderColor: isDark ? "#111827" : "#FFFFFF",
        borderWidth: 2,
        borderRadius: 4,
        shadowBlur: 4,
        shadowColor: "rgba(0,0,0,0.08)",
      },
    }));

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: { name: string; value: number; dataIndex: number; marker: string }) => {
          const pct = data[params.dataIndex]?.percentage ?? (params.value / maxVal * 100);
          const dropOff = params.dataIndex > 0
            ? ((data[params.dataIndex - 1].value - params.value) / data[params.dataIndex - 1].value * 100).toFixed(1)
            : null;
          let html = `${params.marker} <b>${params.name}</b><br/>`;
          html += `Soni: <b>${formatNumber(params.value)}</b> (${pct.toFixed(1)}%)`;
          if (showDropOff && dropOff) {
            html += `<br/>Drop-off: <span style="color:#EF4444">-${dropOff}%</span>`;
          }
          return html;
        },
      },
      legend: {
        show: false,
      },
      series: [
        {
          type: "funnel",
          left: "10%",
          top: 16,
          bottom: 16,
          width: "80%",
          min: 0,
          max: maxVal,
          minSize: "15%",
          maxSize: "100%",
          sort: "descending",
          gap: 4,
          label: {
            show: true,
            position: "inside",
            formatter: (params: { name: string; value: number }) => {
              const pct = (params.value / maxVal * 100).toFixed(1);
              return `{name|${params.name}}\n{val|${formatNumber(params.value)}} {pct|${pct}%}`;
            },
            rich: {
              name: {
                fontSize: 13,
                fontWeight: 600,
                color: "#FFFFFF",
                textShadowColor: "rgba(0,0,0,0.2)",
                textShadowBlur: 4,
                lineHeight: 22,
              },
              val: {
                fontSize: 12,
                color: "rgba(255,255,255,0.9)",
              },
              pct: {
                fontSize: 11,
                color: "rgba(255,255,255,0.7)",
              },
            },
          },
          emphasis: {
            label: { fontSize: 14 },
          },
          data: funnelData,
          animationDuration: 1000,
          animationEasing: "cubicOut",
          animationDelay: (idx: number) => idx * 150,
        },
      ],
    };
  }, [data, isDark, palette, showDropOff]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
