'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Download, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import {
  getRevenueData, getOrdersData, getUsersData, getCategoryData, getRegionData,
  formatCurrency, formatNumber, regionLabels, statusLabels, paymentLabels,
  type RevenueData, type OrdersData, type UsersData, type CategorySales, type RegionData,
} from './actions'
import { exportAnalyticsPDF, exportAnalyticsExcel } from './export'
import UzbekistanMap from '@/components/uzbekistan-map'

// Dynamic import ApexCharts (SSR incompatible)
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const periods = [
  { value: '1d', label: 'Bugun' },
  { value: '7d', label: '7 kun' },
  { value: '30d', label: '30 kun' },
  { value: '90d', label: '90 kun' },
  { value: '1y', label: '1 yil' },
]

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [compare, setCompare] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [orders, setOrders] = useState<OrdersData | null>(null)
  const [users, setUsers] = useState<UsersData | null>(null)
  const [categories, setCategories] = useState<CategorySales[]>([])
  const [regions, setRegions] = useState<RegionData[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rev, ord, usr, cat, reg] = await Promise.all([
        getRevenueData(period, compare),
        getOrdersData(period),
        getUsersData(period, compare),
        getCategoryData(period),
        getRegionData(period),
      ])
      setRevenue(rev)
      setOrders(ord)
      setUsers(usr)
      setCategories(cat)
      setRegions(reg)
    } catch {
      toast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [period, compare])

  useEffect(() => { loadData() }, [loadData])

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      await exportAnalyticsPDF(period, revenue, orders, users, categories, regions)
      toast.success('PDF yuklandi')
    } catch { toast.error('PDF eksport xatolik') }
    finally { setExporting(false) }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      await exportAnalyticsExcel(period, revenue, orders, users, categories, regions)
      toast.success('Excel yuklandi')
    } catch { toast.error('Excel eksport xatolik') }
    finally { setExporting(false) }
  }

  // ========================
  // Chart configurations
  // ========================
  const commonOptions = {
    chart: { toolbar: { show: false }, fontFamily: 'inherit', background: 'transparent' },
    theme: { mode: 'light' as const },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
    tooltip: { theme: 'light' as const },
  }

  // Revenue Area Chart
  const revenueChartOptions: ApexCharts.ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'area', height: 350, animations: { enabled: true, speed: 800 } },
    colors: ['#3b82f6', '#94a3b8'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: [3, 2] },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] },
    },
    xaxis: {
      categories: revenue?.current.map(r => r.date) || [],
      labels: { style: { fontSize: '11px', colors: '#94a3b8' }, rotate: -45, rotateAlways: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', colors: '#94a3b8' },
        formatter: (val: number) => formatCurrency(val) + ' so\'m',
      },
    },
    legend: { show: compare, position: 'top', horizontalAlign: 'right' },
    tooltip: {
      ...commonOptions.tooltip,
      y: { formatter: (val: number) => formatNumber(val) + ' so\'m' },
    },
  }

  const revenueSeries = [
    { name: 'Joriy davr', data: revenue?.current.map(r => r.revenue || 0) || [] },
    ...(compare && revenue?.previous.length ? [{ name: 'O\'tgan davr', data: revenue.previous.map(r => r.revenue || 0) }] : []),
  ]

  // Orders Mixed Chart (bar + line)
  const ordersChartOptions: ApexCharts.ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'bar', height: 320, animations: { enabled: true, speed: 600 } },
    colors: ['#10b981', '#f59e0b'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    dataLabels: { enabled: false },
    stroke: { width: [0, 3], curve: 'smooth' },
    xaxis: {
      categories: orders?.timeSeries.map(o => o.date) || [],
      labels: { style: { fontSize: '11px', colors: '#94a3b8' }, rotate: -45 },
    },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#94a3b8' } } },
    tooltip: { ...commonOptions.tooltip },
  }

  const ordersSeries = [
    { name: 'Buyurtmalar', type: 'bar' as const, data: orders?.timeSeries.map(o => o.count || 0) || [] },
  ]

  // Users Bar Chart
  const usersChartOptions: ApexCharts.ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'bar', height: 300, animations: { enabled: true, speed: 600 } },
    colors: ['#8b5cf6', '#d1d5db'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: users?.current.map(u => u.date) || [],
      labels: { style: { fontSize: '11px', colors: '#94a3b8' }, rotate: -45 },
    },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#94a3b8' } } },
    legend: { show: compare, position: 'top' },
  }

  const usersSeries = [
    { name: 'Yangi foydalanuvchilar', data: users?.current.map(u => u.count || 0) || [] },
    ...(compare && users?.previous.length ? [{ name: 'O\'tgan davr', data: users.previous.map(u => u.count || 0) }] : []),
  ]

  // Category Donut Chart
  const categoryChartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit', background: 'transparent', animations: { enabled: true, speed: 800, animateGradually: { enabled: true } } },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
    labels: categories.map(c => c.name),
    legend: { position: 'bottom', fontSize: '13px' },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      dropShadow: { enabled: false },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '55%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Jami',
              formatter: (w: { globals: { seriesTotals: number[] } }) => {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
                return formatCurrency(total)
              },
            },
          },
        },
      },
    },
    responsive: [{ breakpoint: 480, options: { legend: { position: 'bottom' } } }],
  }

  const categorySeries = categories.map(c => c.revenue)

  // Status Pie Chart
  const statusChartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'pie', fontFamily: 'inherit', background: 'transparent', animations: { enabled: true, speed: 600 } },
    colors: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#6366f1'],
    labels: orders?.statusBreakdown.map(s => statusLabels[s.status] || s.status) || [],
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%`, dropShadow: { enabled: false } },
  }

  const statusSeries = orders?.statusBreakdown.map(s => s.count) || []

  // Payment Horizontal Bar
  const paymentChartOptions: ApexCharts.ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'bar', height: 200 },
    plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '60%' } },
    colors: ['#3b82f6'],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => formatCurrency(val) + ' so\'m',
      style: { fontSize: '11px' },
    },
    xaxis: {
      labels: { formatter: (val: string) => formatCurrency(Number(val)) },
    },
    yaxis: {
      labels: { style: { fontSize: '12px' } },
    },
  }

  const paymentSeries = [{
    name: 'Summa',
    data: orders?.paymentBreakdown.map(p => ({
      x: paymentLabels[p.method] || p.method,
      y: p.total,
    })) || [],
  }]

  if (loading && !revenue) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analitika</h1>
          <p className="text-muted-foreground">Platforma statistikasi va tahlil</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
            <Download className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* Period Filter + Compare Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            {periods.map(p => (
              <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Switch id="compare" checked={compare} onCheckedChange={setCompare} />
          <Label htmlFor="compare" className="text-sm">O&apos;tgan davr bilan solishtirish</Label>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenue?.summary.totalRevenue || 0)} so&apos;m</div>
            <div className="flex items-center gap-1 mt-1">
              {(revenue?.summary.growthPercent || 0) >= 0 ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />+{revenue?.summary.growthPercent}%
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                  <TrendingDown className="w-3 h-3 mr-1" />{revenue?.summary.growthPercent}%
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">o&apos;tgan davrga nisbatan</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buyurtmalar</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(revenue?.summary.totalOrders || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              O&apos;rtacha: {formatCurrency(revenue?.summary.avgOrderValue || 0)} so&apos;m
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yangi foydalanuvchilar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(users?.summary.totalNew || 0)}</div>
            <div className="flex items-center gap-1 mt-1">
              {(users?.summary.growthPercent || 0) >= 0 ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />+{users?.summary.growthPercent}%
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                  <TrendingDown className="w-3 h-3 mr-1" />{users?.summary.growthPercent}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hududlar</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Faol hududlar soni
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daromad dinamikasi</CardTitle>
          <CardDescription>
            {compare ? 'Joriy va o\'tgan davr taqqoslanmoqda' : `So'nggi ${periods.find(p => p.value === period)?.label} daromadlar`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {typeof window !== 'undefined' && (
            <Chart options={revenueChartOptions} series={revenueSeries} type="area" height={350} />
          )}
        </CardContent>
      </Card>

      {/* Orders + Users Charts - 2 columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Buyurtmalar soni</CardTitle>
            <CardDescription>Kunlik buyurtmalar hajmi</CardDescription>
          </CardHeader>
          <CardContent>
            {typeof window !== 'undefined' && (
              <Chart options={ordersChartOptions} series={ordersSeries} type="bar" height={320} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yangi foydalanuvchilar</CardTitle>
            <CardDescription>Ro&apos;yxatdan o&apos;tish dinamikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {typeof window !== 'undefined' && (
              <Chart options={usersChartOptions} series={usersSeries} type="bar" height={320} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Donut + Status Pie - 2 columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kategoriyalar bo&apos;yicha sotuvlar</CardTitle>
            <CardDescription>Daromad ulushi foizda</CardDescription>
          </CardHeader>
          <CardContent>
            {typeof window !== 'undefined' && categories.length > 0 && (
              <Chart options={categoryChartOptions} series={categorySeries} type="donut" height={350} />
            )}
            {categories.length === 0 && (
              <div className="text-center text-muted-foreground py-10">Ma&apos;lumot yo&apos;q</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buyurtma statuslari</CardTitle>
            <CardDescription>Joriy davrdagi statuslar taqsimoti</CardDescription>
          </CardHeader>
          <CardContent>
            {typeof window !== 'undefined' && statusSeries.length > 0 && (
              <Chart options={statusChartOptions} series={statusSeries} type="pie" height={350} />
            )}
            {statusSeries.length === 0 && (
              <div className="text-center text-muted-foreground py-10">Ma&apos;lumot yo&apos;q</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>To&apos;lov usullari</CardTitle>
          <CardDescription>Qaysi to&apos;lov usuli ko&apos;p ishlatilmoqda</CardDescription>
        </CardHeader>
        <CardContent>
          {typeof window !== 'undefined' && (orders?.paymentBreakdown.length || 0) > 0 && (
            <Chart options={paymentChartOptions} series={paymentSeries} type="bar" height={200} />
          )}
        </CardContent>
      </Card>

      {/* Map + Top Regions Table */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hududlar bo&apos;yicha statistika</CardTitle>
            <CardDescription>O&apos;zbekiston xaritasida buyurtmalar taqsimoti</CardDescription>
          </CardHeader>
          <CardContent>
            <UzbekistanMap data={regions} labels={regionLabels} formatRevenue={formatCurrency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top hududlar</CardTitle>
            <CardDescription>Eng ko&apos;p buyurtmali hududlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regions.slice(0, 10).map((r, i) => (
                <div key={r.region} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <div>
                      <div className="font-medium">{regionLabels[r.region] || r.region}</div>
                      <div className="text-xs text-muted-foreground">{formatNumber(r.count)} buyurtma</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(r.revenue)} so&apos;m</div>
                    <div className="text-xs text-muted-foreground">
                      {regions.length > 0 ? Math.round(r.revenue / regions.reduce((s, x) => s + x.revenue, 0) * 100) : 0}%
                    </div>
                  </div>
                </div>
              ))}
              {regions.length === 0 && (
                <div className="text-center text-muted-foreground py-6">Ma&apos;lumot yo&apos;q</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
