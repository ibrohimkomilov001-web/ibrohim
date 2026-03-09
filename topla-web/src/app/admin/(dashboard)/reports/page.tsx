'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getReportData, type ReportData } from './actions'
import { toast } from 'sonner'
import { useUrlState } from '@/hooks/use-url-state'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#8b5cf6',
  shipping: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#ef4444',
  ready_for_pickup: '#6366f1',
  courier_assigned: '#ec4899',
  courier_picked_up: '#14b8a6',
  at_pickup_point: '#f97316',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Kutilmoqda',
  processing: 'Tayyorlanmoqda',
  shipping: 'Yetkazilmoqda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
  ready_for_pickup: 'Tayyor',
  courier_assigned: 'Kuryer tayinlandi',
  courier_picked_up: 'Kuryer oldi',
  at_pickup_point: 'Punktda',
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [{ period }, setFilters] = useUrlState({ period: 'month' })
  const [data, setData] = useState<ReportData | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const reportData = await getReportData(period)
      setData(reportData)
    } catch (error) {
      console.error(error)
      toast.error("Hisobotni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [period])

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  if (loading || !data) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const revenueGrowth = calculateGrowth(data.salesOverview.totalRevenue, data.salesOverview.previousRevenue)
  const ordersGrowth = calculateGrowth(data.salesOverview.totalOrders, data.salesOverview.previousOrders)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Hisobotlar</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Savdo va statistika hisobotlari</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setFilters({ period: v })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Haftalik</SelectItem>
              <SelectItem value="month">Oylik</SelectItem>
              <SelectItem value="year">Yillik</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-medium">Jami daromad</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatPrice(data.salesOverview.totalRevenue)}</div>
            <div className={`text-xs flex items-center gap-1 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(revenueGrowth).toFixed(1)}% oldingi davr
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-medium">Buyurtmalar</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{data.salesOverview.totalOrders}</div>
            <div className={`text-xs flex items-center gap-1 ${ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ordersGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(ordersGrowth).toFixed(1)}% oldingi davr
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-medium">O'rtacha chek</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatPrice(data.salesOverview.averageOrderValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-medium">Foydalanuvchilar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{data.userStats.totalUsers}</div>
            <div className="text-xs text-muted-foreground">+{data.userStats.newUsersThisMonth} yangi</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders by Status — Pie Chart */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Buyurtmalar holati</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {data.ordersByStatus.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.ordersByStatus.map(d => ({ ...d, label: STATUS_LABELS[d.status] || d.status }))}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={90}
                    dataKey="count" nameKey="label"
                    paddingAngle={2}
                  >
                    {data.ordersByStatus.map((item) => (
                      <Cell key={item.status} fill={STATUS_COLORS[item.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="vertical" align="right" verticalAlign="middle"
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Shops */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Eng yaxshi do'konlar</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {data.topShops.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
            ) : (
              <div className="space-y-3">
                {data.topShops.slice(0, 5).map((shop, i) => (
                  <div key={shop.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="font-medium text-sm truncate">{shop.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{formatPrice(shop.revenue)}</div>
                      <div className="text-xs text-muted-foreground">{shop.orders_count} buyurtma</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Eng ko'p sotilgan mahsulotlar</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {data.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.slice(0, 5).map((product, i) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="font-medium text-sm truncate">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{formatPrice(product.revenue)}</div>
                      <div className="text-xs text-muted-foreground">{product.orders_count} dona</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Kunlik daromad</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {data.revenueByDay.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenueByDay.map(d => ({
                ...d,
                label: new Date(d.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' }),
              }))}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatPrice(value), 'Daromad']} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
