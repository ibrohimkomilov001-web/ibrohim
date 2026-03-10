"use client";

import { useMemo } from "react";
import { EChartsWrapper } from "./echarts-wrapper";
import { useTheme } from "next-themes";
import { CHART_COLORS } from "./chart-theme";

export interface SankeyChartProps {
  nodes: { name: string }[];
  links: { source: string; target: string; value: number }[];
  height?: number;
  className?: string;
}

export function SankeyChart({ nodes, links, height = 350, className }: SankeyChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  const option = useMemo(() => {
    const coloredNodes = nodes.map((n, i) => ({
      ...n,
      itemStyle: { color: palette[i % palette.length] },
    }));

    return {
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
      },
      series: [
        {
          type: "sankey",
          layout: "none",
          emphasis: { focus: "adjacency" },
          nodeAlign: "left",
          nodeGap: 12,
          nodeWidth: 20,
          layoutIterations: 32,
          left: 16,
          right: 16,
          top: 16,
          bottom: 16,
          data: coloredNodes,
          links,
          lineStyle: {
            color: "gradient",
            curveness: 0.5,
            opacity: isDark ? 0.35 : 0.25,
          },
          label: {
            color: isDark ? "#D1D5DB" : "#374151",
            fontSize: 12,
            fontWeight: 500,
          },
          animationDuration: 1500,
          animationEasing: "cubicOut",
        },
      ],
    };
  }, [nodes, links, isDark, palette]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
