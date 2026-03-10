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
import { RevenueAreaChart, StackedBarChart } from "@/components/charts";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { formatPrice } from "@/lib/utils";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight,
  DollarSign, CreditCard, Receipt, BarChart3,
  Download, Calendar,
} from "lucide-react";
import { useTranslation } from '@/store/locale-store';

export default function FinanceDashboardPage() {
  const { t } = useTranslation();
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
    revenue: d.revenue,
    orders: d.orders,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary" />
            {t('financeDashboard')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('financeStatus')}</p>
        </div>
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('week')}</SelectItem>
            <SelectItem value="month">{t('month')}</SelectItem>
            <SelectItem value="quarter">{t('quarter')}</SelectItem>
            <SelectItem value="year">{t('year')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('overviewTab')}</TabsTrigger>
          <TabsTrigger value="reports">{t('monthlyReports')}</TabsTrigger>
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
                      <Wallet className="w-4 h-4" /> {t('currentBalanceLabel')}
                    </div>
                    <p className="text-2xl font-bold">{formatPrice(fin?.balance || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4 text-green-500" /> {t('totalRevenueLabel')}
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatPrice(fin?.totalRevenue || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{fin?.orderCount || 0} {t('orderCountLabel')}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Receipt className="w-4 h-4 text-amber-500" /> {t('commissionLabel')}
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
                      <CreditCard className="w-4 h-4 text-blue-500" /> {t('paidLabel')}
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{formatPrice(fin?.totalPayoutsCompleted || 0)}</p>
                    {(fin?.totalPayoutsPending || 0) > 0 && (
                      <p className="text-xs text-amber-500 mt-1">{t('pendingPayouts')}: {formatPrice(fin.totalPayoutsPending)}</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dailyRevenue')}</CardTitle>
              <CardDescription>
                {t('avgOrder')}: {formatPrice(fin?.avgOrderValue || 0)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : chartData.length > 0 ? (
                <RevenueAreaChart
                  data={chartData}
                  height={288}
                  valueFormatter={(v: number) => formatPrice(v)}
                  showOrders
                />
              ) : (
                <p className="text-center py-16 text-muted-foreground">{t('noDataAvailable')}</p>
              )}
            </CardContent>
          </Card>

          {/* Net Revenue Summary */}
          {fin && (
            <Card>
              <CardHeader>
                <CardTitle>{t('netRevenueCalc')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t('totalRevenueLabel')}</span>
                    <span className="font-medium text-green-600">+{formatPrice(fin.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t('commissionLabel')}</span>
                    <span className="font-medium text-red-500">-{formatPrice(fin.totalCommission)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>{t('netRevenue')}</span>
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
              <CardTitle>{t('monthlyFinanceReports')}</CardTitle>
              <CardDescription>{t('lastTwelveMonths')}</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : monthlyReports.length > 0 ? (
                <StackedBarChart
                  categories={monthlyReports.map((r: any) => r.month)}
                  series={[
                    { name: t('revenueChartLabel'), data: monthlyReports.map((r: any) => r.revenue) },
                    { name: t('commissionChartLabel'), data: monthlyReports.map((r: any) => r.commission) },
                    { name: t('payoutChartLabel'), data: monthlyReports.map((r: any) => r.payouts) },
                  ]}
                  height={288}
                  grouped
                />
              ) : (
                <p className="text-center py-16 text-muted-foreground">{t('noDataAvailable')}</p>
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
                      <th className="text-left p-3 font-medium">{t('monthColumn')}</th>
                      <th className="text-right p-3 font-medium">{t('ordersColumn')}</th>
                      <th className="text-right p-3 font-medium">{t('revenueColumn')}</th>
                      <th className="text-right p-3 font-medium">{t('commissionColumn')}</th>
                      <th className="text-right p-3 font-medium">{t('payoutColumn')}</th>
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
                        <td className="p-3">{t('totalRow')}</td>
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
