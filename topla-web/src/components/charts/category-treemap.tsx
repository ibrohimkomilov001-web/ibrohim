"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";
import { CHART_COLORS } from "./chart-theme";
import { formatPrice, formatNumber } from "@/lib/utils";

export interface CategoryTreemapProps {
  data: { name: string; value: number; count?: number }[];
  height?: number;
  className?: string;
  valueFormatter?: (v: number) => string;
  valueLabel?: string;
}

export function CategoryTreemap({
  data,
  height = 300,
  className,
  valueFormatter = formatPrice,
  valueLabel = "Daromad",
}: CategoryTreemapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  const option = useMemo(() => {
    const treemapData = data
      .filter((d) => d.value > 0)
      .map((d, i) => ({
        name: d.name,
        value: d.value,
        count: d.count,
        itemStyle: { color: palette[i % palette.length] },
      }));

    return {
      tooltip: {
        formatter: (params: { name: string; value: number; data: { count?: number }; marker: string }) => {
          let html = `${params.marker} <b>${params.name}</b><br/>${valueLabel}: <b>${valueFormatter(params.value)}</b>`;
          if (params.data.count != null) {
            html += `<br/>Soni: <b>${formatNumber(params.data.count)}</b>`;
          }
          return html;
        },
      },
      series: [
        {
          type: "treemap",
          data: treemapData,
          width: "100%",
          height: "100%",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          itemStyle: {
            borderColor: isDark ? "#1F2937" : "#FFFFFF",
            borderWidth: 3,
            borderRadius: 6,
            gapWidth: 2,
          },
          label: {
            show: true,
            formatter: "{b}",
            fontSize: 12,
            fontWeight: 500,
            color: "#FFFFFF",
            textShadowColor: "rgba(0,0,0,0.3)",
            textShadowBlur: 4,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 12,
              shadowColor: "rgba(0,0,0,0.15)",
            },
          },
          levels: [
            {
              itemStyle: { borderWidth: 0, gapWidth: 3 },
            },
          ],
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
      ],
    };
  }, [data, isDark, palette, valueFormatter, valueLabel]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
