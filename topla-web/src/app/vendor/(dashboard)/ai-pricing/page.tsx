"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatPrice } from "@/lib/utils";
import { useTranslation } from "@/store/locale-store";
import {
  BrainCircuit, TrendingUp, TrendingDown, AlertTriangle,
  ArrowRight, BarChart3, DollarSign, Target, Zap,
} from "lucide-react";

export default function AIPricingPage() {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Get all price alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["ai-price-alerts"],
    queryFn: () => vendorApi.getAIPriceAlerts(),
  });

  // Get suggestion for selected product
  const { data: suggestion, isLoading: suggLoading } = useQuery({
    queryKey: ["ai-price-suggestion", selectedProduct],
    queryFn: () => vendorApi.getAIPriceSuggestion(selectedProduct!),
    enabled: !!selectedProduct,
  });

  const alertList = Array.isArray(alerts) ? alerts : [];
  const suggData = suggestion;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
          <BrainCircuit className="w-7 h-7 text-primary" />
          AI Narx Tavsiyasi
        </h1>
        <p className="text-muted-foreground mt-1">
          Raqobatchilar narxini tahlil qiling va optimal narx belgilang
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="w-4 h-4" />
              Ogohlantirishlar
            </div>
            <p className="text-2xl font-bold">{alertList.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4 text-red-500" />
              Qimmat narx
            </div>
            <p className="text-2xl font-bold text-red-500">
              {alertList.filter((a: any) => a.alert === 'overpriced').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="w-4 h-4 text-green-500" />
              Arzon narx
            </div>
            <p className="text-2xl font-bold text-green-500">
              {alertList.filter((a: any) => a.alert === 'underpriced').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="w-4 h-4 text-blue-500" />
              Tahlil qilingan
            </div>
            <p className="text-2xl font-bold text-blue-500">{alertList.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Price Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Narx Ogohlantirishlari
          </CardTitle>
          <CardDescription>
            Raqobatchilar bilan taqqoslaganda narx farqi 15% dan ortiq mahsulotlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : alertList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BrainCircuit className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Hozircha narx ogohlantirishlari yo&apos;q</p>
              <p className="text-sm">Barcha mahsulot narxlari raqobatbardosh</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertList.map((alert: any) => (
                <div
                  key={alert.productId}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50
                    ${selectedProduct === alert.productId ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setSelectedProduct(alert.productId)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{alert.productName}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Sizning: {formatPrice(alert.currentPrice)}</span>
                      <span>O&apos;rtacha: {formatPrice(alert.avgCompetitorPrice)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={alert.alert === 'overpriced' ? 'destructive' : 'default'} className="shrink-0">
                      {alert.priceDiffPercent > 0 ? '+' : ''}{alert.priceDiffPercent}%
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Suggestion */}
      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Batafsil Tahlil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suggLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : suggData ? (
              <div className="space-y-6">
                {/* Price comparison chart */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Sizning narx</p>
                    <p className="text-lg font-bold">{formatPrice(suggData.currentPrice)}</p>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground">AI Tavsiya</p>
                    <p className="text-lg font-bold text-primary">
                      {suggData.suggestedPrice ? formatPrice(suggData.suggestedPrice) : '—'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Eng arzon</p>
                    <p className="text-lg font-bold">{formatPrice(suggData.competitors?.minPrice)}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Eng qimmat</p>
                    <p className="text-lg font-bold">{formatPrice(suggData.competitors?.maxPrice)}</p>
                  </div>
                </div>

                {/* Competitors info */}
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="font-medium mb-2">Raqobatchilar ({suggData.competitors?.count} ta mahsulot)</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">O&apos;rtacha narx: </span>
                      <span className="font-medium">{formatPrice(suggData.competitors?.avgPrice)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Median narx: </span>
                      <span className="font-medium">{formatPrice(suggData.competitors?.medianPrice)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Og&apos;irlangan o&apos;rtacha: </span>
                      <span className="font-medium">{formatPrice(suggData.competitors?.weightedAvg)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Holat: </span>
                      <Badge variant={
                        suggData.pricePosition === 'competitive' ? 'default' :
                        suggData.pricePosition === 'high' ? 'destructive' : 'secondary'
                      }>
                        {suggData.pricePosition === 'competitive' ? 'Raqobatbardosh' :
                         suggData.pricePosition === 'high' ? 'Qimmat' : 'O\'rtacha'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                {suggData.tips && suggData.tips.length > 0 && (
                  <div className="p-4 rounded-lg border-l-4 border-primary bg-primary/5">
                    <p className="font-medium mb-2 flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4" /> AI Maslahatlar
                    </p>
                    <ul className="space-y-1 text-sm">
                      {suggData.tips.map((tip: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">Ma&apos;lumot mavjud emas</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
