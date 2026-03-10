"use client";

import { useEffect, useRef, useState, memo } from "react";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { TOPLA_THEME_LIGHT, TOPLA_THEME_DARK } from "./chart-theme";

// Dynamic import to avoid SSR issues with echarts
let echarts: typeof import("echarts") | null = null;

function getEcharts() {
  if (!echarts) {
    echarts = require("echarts");
  }
  return echarts!;
}

export interface EChartsWrapperProps {
  option: Record<string, unknown>;
  height?: number | string;
  className?: string;
  loading?: boolean;
  notMerge?: boolean;
  style?: React.CSSProperties;
  onEvents?: Record<string, (params: unknown) => void>;
}

function EChartsWrapperInner({
  option,
  height = 300,
  className = "",
  loading = false,
  notMerge = false,
  style,
  onEvents,
}: EChartsWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import("echarts")["init"]> | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === "dark";

  // Mount guard for SSR
  useEffect(() => {
    setMounted(true);
    return () => {
      if (chartRef.current) {
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const ec = getEcharts();
    const theme = isDark ? TOPLA_THEME_DARK : TOPLA_THEME_LIGHT;

    // Register custom themes
    ec.registerTheme("topla-light", TOPLA_THEME_LIGHT);
    ec.registerTheme("topla-dark", TOPLA_THEME_DARK);

    // Dispose and reinit on theme change
    if (chartRef.current) {
      chartRef.current.dispose();
    }

    const chart = ec.init(containerRef.current, isDark ? "topla-dark" : "topla-light", {
      renderer: "canvas",
    });

    chartRef.current = chart;

    // Apply merged option with theme defaults
    const mergedOption = {
      grid: theme.grid,
      tooltip: {
        ...theme.tooltip,
        trigger: "axis" as const,
        confine: true,
      },
      animationDuration: 600,
      animationEasing: "cubicOut" as const,
      ...option,
    };

    chart.setOption(mergedOption, notMerge);

    // Bind events
    if (onEvents) {
      Object.entries(onEvents).forEach(([event, handler]) => {
        chart.on(event, handler as (...args: unknown[]) => void);
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isDark]);

  // Update option when it changes (not on init)
  useEffect(() => {
    if (!chartRef.current || !mounted) return;
    chartRef.current.setOption(option, notMerge);
  }, [option, notMerge, mounted]);

  // Responsive resize
  useEffect(() => {
    if (!chartRef.current || !containerRef.current) return;

    const ro = new ResizeObserver(() => {
      chartRef.current?.resize({ animation: { duration: 200 } });
    });
    ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <Skeleton
        className={className}
        style={{ height: typeof height === "number" ? height : undefined, ...style }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: "100%",
        ...style,
      }}
    />
  );
}

export const EChartsWrapper = memo(EChartsWrapperInner);
export default EChartsWrapper;
