"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SparklineChart } from "./sparkline-chart";

export interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  sparklineData?: number[];
  color?: "primary" | "success" | "warning" | "destructive" | "info" | "purple" | "orange" | "teal";
  className?: string;
}

const COLOR_MAP = {
  primary: {
    iconBg: "bg-indigo-50 dark:bg-indigo-950/40",
    iconText: "text-indigo-600 dark:text-indigo-400",
    sparkColor: "#5B5FC7",
  },
  success: {
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconText: "text-emerald-600 dark:text-emerald-400",
    sparkColor: "#10B981",
  },
  warning: {
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconText: "text-amber-600 dark:text-amber-400",
    sparkColor: "#F59E0B",
  },
  destructive: {
    iconBg: "bg-red-50 dark:bg-red-950/40",
    iconText: "text-red-600 dark:text-red-400",
    sparkColor: "#EF4444",
  },
  info: {
    iconBg: "bg-sky-50 dark:bg-sky-950/40",
    iconText: "text-sky-600 dark:text-sky-400",
    sparkColor: "#06B6D4",
  },
  purple: {
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconText: "text-blue-600 dark:text-blue-400",
    sparkColor: "#8B5CF6",
  },
  orange: {
    iconBg: "bg-orange-50 dark:bg-orange-950/40",
    iconText: "text-orange-600 dark:text-orange-400",
    sparkColor: "#F97316",
  },
  teal: {
    iconBg: "bg-teal-50 dark:bg-teal-950/40",
    iconText: "text-teal-600 dark:text-teal-400",
    sparkColor: "#14B8A6",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  sparklineData,
  color = "primary",
  className,
}: StatCardProps) {
  const colors = COLOR_MAP[color];

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
      : trend === "down"
        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
        : "text-muted-foreground bg-muted";

  return (
    <Card className={cn("relative overflow-hidden p-4 sm:p-5 transition-all hover:shadow-elevation-2", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            {Icon && (
              <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl", colors.iconBg)}>
                <Icon className={cn("w-[18px] h-[18px]", colors.iconText)} />
              </div>
            )}
            <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
            {trend && trendValue && (
              <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold", trendColor)}>
                <TrendIcon className="w-3 h-3" />
                {trendValue}
              </span>
            )}
          </div>
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-20 h-10 flex-shrink-0 opacity-80">
            <SparklineChart data={sparklineData} color={colors.sparkColor} height={40} />
          </div>
        )}
      </div>
    </Card>
  );
}
