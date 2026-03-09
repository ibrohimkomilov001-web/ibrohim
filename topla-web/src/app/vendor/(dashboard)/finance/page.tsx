"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AreaChart, BarChart } from "@tremor/react";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatPrice } from "@/lib/utils";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight,
  DollarSign, CreditCard, Receipt, BarChart3,
  Download, Calendar,
} from "lucide-react";

export default function FinanceDashboardPage() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["vendor-finance-summary", period],
    queryFn: () => vendorApi.getFinanceSummary(period),
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["vendor-finance-reports"],
    queryFn: () => vendorApi.getFinanceReports(),
  });

  const fin = summary?.data;
  const monthlyReports = reports?.data || [];

  const chartData = fin?.dailyBreakdown?.map((d: any) => ({
    date: d.date,
    "Daromad": d.revenue,
    "Buyurtmalar": d.orders,
  })) || [];

  const reportsChartData = monthlyReports.map((r: any) => ({
    month: r.month,
    "Daromad": r.revenue,
    "Komissiya": r.commission,
    "To'lov": r.payouts,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary" />
            Moliya Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Moliyaviy holat va hisobotlar</p>
        </div>
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Hafta</SelectItem>
            <SelectItem value="month">Oy</SelectItem>
            <SelectItem value="quarter">Chorak</SelectItem>
            <SelectItem value="year">Yil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Xulosa</TabsTrigger>
          <TabsTrigger value="reports">Oylik hisobotlar</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryLoading ? (
              [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)
            ) : (
              <>
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Wallet className="w-4 h-4" /> Joriy balans
                    </div>
                    <p className="text-2xl font-bold">{formatPrice(fin?.balance || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4 text-green-500" /> Jami daromad
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatPrice(fin?.totalRevenue || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{fin?.orderCount || 0} buyurtma</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Receipt className="w-4 h-4 text-amber-500" /> Komissiya
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{formatPrice(fin?.totalCommission || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fin?.totalRevenue > 0 ? ((fin.totalCommission / fin.totalRevenue) * 100).toFixed(1) : 0}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <CreditCard className="w-4 h-4 text-blue-500" /> To&apos;langan
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{formatPrice(fin?.totalPayoutsCompleted || 0)}</p>
                    {(fin?.totalPayoutsPending || 0) > 0 && (
                      <p className="text-xs text-amber-500 mt-1">Kutilmoqda: {formatPrice(fin.totalPayoutsPending)}</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Kunlik daromad</CardTitle>
              <CardDescription>
                O&apos;rtacha buyurtma: {formatPrice(fin?.avgOrderValue || 0)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : chartData.length > 0 ? (
                <AreaChart
                  data={chartData}
                  index="date"
                  categories={["Daromad"]}
                  colors={["violet"]}
                  className="h-72"
                  valueFormatter={(v: number) => formatPrice(v)}
                />
              ) : (
                <p className="text-center py-16 text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
              )}
            </CardContent>
          </Card>

          {/* Net Revenue Summary */}
          {fin && (
            <Card>
              <CardHeader>
                <CardTitle>Sof daromad hisob-kitobi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Jami daromad</span>
                    <span className="font-medium text-green-600">+{formatPrice(fin.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Komissiya</span>
                    <span className="font-medium text-red-500">-{formatPrice(fin.totalCommission)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Sof daromad</span>
                    <span className="text-primary">{formatPrice(fin.netRevenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* MONTHLY REPORTS */}
        <TabsContent value="reports" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Oylik moliyaviy hisobotlar</CardTitle>
              <CardDescription>Oxirgi 12 oy</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : reportsChartData.length > 0 ? (
                <BarChart
                  data={reportsChartData}
                  index="month"
                  categories={["Daromad", "Komissiya", "To'lov"]}
                  colors={["emerald", "amber", "blue"]}
                  className="h-72"
                  valueFormatter={(v: number) => formatPrice(v)}
                />
              ) : (
                <p className="text-center py-16 text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
              )}
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Oy</th>
                      <th className="text-right p-3 font-medium">Buyurtmalar</th>
                      <th className="text-right p-3 font-medium">Daromad</th>
                      <th className="text-right p-3 font-medium">Komissiya</th>
                      <th className="text-right p-3 font-medium">To&apos;lov</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReports.map((r: any) => (
                      <tr key={r.month} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {r.month}
                        </td>
                        <td className="p-3 text-right">{r.orders}</td>
                        <td className="p-3 text-right text-green-600 font-medium">{formatPrice(r.revenue)}</td>
                        <td className="p-3 text-right text-amber-600">{formatPrice(r.commission)}</td>
                        <td className="p-3 text-right text-blue-600">{formatPrice(r.payouts)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {monthlyReports.length > 0 && (
                    <tfoot>
                      <tr className="bg-muted/50 font-bold">
                        <td className="p-3">Jami</td>
                        <td className="p-3 text-right">{monthlyReports.reduce((s: number, r: any) => s + r.orders, 0)}</td>
                        <td className="p-3 text-right text-green-600">
                          {formatPrice(monthlyReports.reduce((s: number, r: any) => s + r.revenue, 0))}
                        </td>
                        <td className="p-3 text-right text-amber-600">
                          {formatPrice(monthlyReports.reduce((s: number, r: any) => s + r.commission, 0))}
                        </td>
                        <td className="p-3 text-right text-blue-600">
                          {formatPrice(monthlyReports.reduce((s: number, r: any) => s + r.payouts, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
