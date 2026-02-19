'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getReportData, type ReportData } from './actions'
import { useToast } from '@/components/ui/use-toast'

export default function AdminReportsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [data, setData] = useState<ReportData | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const reportData = await getReportData(period)
      setData(reportData)
    } catch (error) {
      console.error(error)
      toast({ title: "Xatolik", description: "Hisobotni yuklashda xatolik", variant: "destructive" })
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
          <Select value={period} onValueChange={(v: typeof period) => setPeriod(v)}>
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

      {/* Orders by Status */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Buyurtmalar holati</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.ordersByStatus.map((item) => (
              <div key={item.status} className="bg-muted rounded-lg p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold">{item.count}</div>
                <div className="text-xs text-muted-foreground capitalize">{item.status}</div>
              </div>
            ))}
          </div>
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

      {/* Revenue Chart (Simple) */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Kunlik daromad</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {data.revenueByDay.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
          ) : (
            <div className="space-y-2">
              {data.revenueByDay.slice(-7).map((day) => {
                const maxRevenue = Math.max(...data.revenueByDay.map(d => d.revenue))
                const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20">
                      {new Date(day.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-24 text-right">{formatPrice(day.revenue)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
