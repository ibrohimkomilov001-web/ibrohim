"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Award,
  ShieldCheck,
  Package,
  Star,
  Clock,
  XCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { useTranslation } from "@/store/locale-store";

const LEVEL_CONFIG = {
  bronze: { color: "text-orange-700 bg-orange-100 border-orange-300", label: "Bronze", icon: Award },
  silver: { color: "text-gray-600 bg-gray-100 border-gray-300", label: "Silver", icon: Award },
  gold: { color: "text-yellow-600 bg-yellow-100 border-yellow-300", label: "Gold", icon: Award },
  platinum: { color: "text-blue-600 bg-blue-100 border-blue-300", label: "Platinum", icon: ShieldCheck },
};

const METRIC_ICONS: Record<string, any> = {
  fulfillmentRate: Package,
  cancellationRate: XCircle,
  returnRate: RotateCcw,
  reviewScore: Star,
  productQuality: TrendingUp,
  shippingSpeed: Clock,
};

const METRIC_LABELS: Record<string, string> = {
  fulfillmentRate: "Buyurtma bajarish",
  cancellationRate: "Bekor qilish darajasi",
  returnRate: "Qaytarish darajasi",
  reviewScore: "Sharhlar bahosi",
  productQuality: "Mahsulot sifati",
  shippingSpeed: "Yetkazib berish tezligi",
};

export default function PerformancePage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

  const { data: performance, isLoading } = useQuery({
    queryKey: ["vendor-performance", period],
    queryFn: () => vendorApi.getPerformance(period),
  });

  const perf = (performance as any)?.data || performance;
  const level = perf?.level || 'bronze';
  const overall = perf?.overall || 0;
  const metrics = perf?.metrics || {};
  const levelCfg = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.bronze;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Samaradorlik ko&apos;rsatkichlari</h1>
          <p className="text-muted-foreground">
            Do&apos;kon faoliyatini kuzating va yaxshilang
          </p>
        </div>
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Hafta</SelectItem>
            <SelectItem value="month">Oy</SelectItem>
            <SelectItem value="year">Yil</SelectItem>
            <SelectItem value="all">Barchasi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Overall Score */}
          <Card>
            <CardContent className="p-8 text-center">
              <div className="relative inline-flex items-center justify-center mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                    strokeDasharray={`${overall * 3.27} ${327 - overall * 3.27}`}
                    strokeLinecap="round"
                    className={cn(
                      overall >= 90 ? "text-blue-500" :
                      overall >= 75 ? "text-yellow-500" :
                      overall >= 55 ? "text-gray-500" : "text-orange-500"
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{Math.round(overall)}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
              <Badge className={cn("text-sm px-4 py-1", levelCfg.color)}>
                <levelCfg.icon className="mr-1 h-4 w-4" />
                {levelCfg.label} daraja
              </Badge>
              <p className="text-sm text-muted-foreground mt-3">
                {overall >= 90 ? "Ajoyib natijalar! Siz eng yaxshi sotuvchilardan birisiz." :
                 overall >= 75 ? "Yaxshi natijalar! Ozgina yaxshilanish bilan platinum darajaga ko'tarilishingiz mumkin." :
                 overall >= 55 ? "O'rtacha natijalar. Quyidagi ko'rsatkichlarni yaxshilang." :
                 "Diqqat! Ko'rsatkichlarni yaxshilash kerak."}
              </p>
            </CardContent>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(metrics).map(([key, metric]: [string, any]) => {
              const Icon = METRIC_ICONS[key] || TrendingUp;
              const isNegative = key === 'cancellationRate' || key === 'returnRate';
              const displayValue = metric.value;
              const scoreColor = metric.weightedScore / metric.weight >= 80 ? "text-green-600" :
                                 metric.weightedScore / metric.weight >= 50 ? "text-yellow-600" : "text-red-600";
              return (
                <Card key={key}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        og&apos;irlik: {Math.round(metric.weight * 100)}%
                      </span>
                    </div>
                    <h3 className="font-medium text-sm mb-1">
                      {METRIC_LABELS[key] || metric.label}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-2xl font-bold", scoreColor)}>
                        {isNegative ? `${displayValue.toFixed(1)}%` : 
                         key === 'reviewScore' ? displayValue.toFixed(1) :
                         `${displayValue.toFixed(0)}%`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ball: {metric.weightedScore.toFixed(1)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", scoreColor.replace('text-', 'bg-'))}
                        style={{ width: `${Math.min(100, (metric.weightedScore / metric.weight) * 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tips Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Yaxshilash bo&apos;yicha maslahatlar</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {(metrics as any)?.fulfillmentRate?.value < 95 && (
                  <li className="flex items-start gap-2">
                    <Package className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    Buyurtmalarni o&apos;z vaqtida bajaring — fulfillment rate ni 95%+ ga olib chiqing.
                  </li>
                )}
                {(metrics as any)?.cancellationRate?.value > 5 && (
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    Bekor qilishlarni kamaytiring — stok va narxlarni yangilab turing.
                  </li>
                )}
                {(metrics as any)?.reviewScore?.value < 4 && (
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    Sharhlar bahosini oshiring — xaridorlar bilan yaxshi muloqot qiling.
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Mahsulot rasmlarini sifatli va turli burchakdan qo&apos;ying.
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
