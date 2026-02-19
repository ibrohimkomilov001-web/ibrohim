'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getOrders, getOrderStats, updateOrderStatus, type Order } from './actions'
import { useToast } from '@/components/ui/use-toast'

const statusConfig: Record<string, { color: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { color: 'secondary', label: 'Kutilmoqda' },
  processing: { color: 'default', label: 'Jarayonda' },
  shipped: { color: 'outline', label: "Yo'lda" },
  delivered: { color: 'default', label: 'Yetkazildi' },
  cancelled: { color: 'destructive', label: 'Bekor qilindi' },
}

export default function AdminOrdersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, totalRevenue: 0 })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [ordersData, statsData] = await Promise.all([
        getOrders(),
        getOrderStats()
      ])
      setOrders(ordersData)
      setStats(statsData)
    } catch (error) {
      console.error(error)
      toast({ title: "Xatolik", description: "Ma'lumotlarni yuklashda xatolik", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || order.status === activeTab
    return matchesSearch && matchesTab
  })

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return

    try {
      setActionLoading(true)
      await updateOrderStatus(selectedOrder.id, newStatus)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Buyurtma statusi yangilandi" })
      setStatusDialogOpen(false)
      setSelectedOrder(null)
      setNewStatus('')
    } catch (error) {
      toast({ title: "Xatolik", description: "Statusni yangilashda xatolik", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Buyurtmalar</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Barcha buyurtmalarni boshqaring
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kutilmoqda</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jarayonda</CardTitle>
            <span className="text-2xl">🔄</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yetkazildi</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daromad</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Buyurtmalar ro'yxati</CardTitle>
              <CardDescription>Buyurtmalar statusini kuzating</CardDescription>
            </div>
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72"
            />
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex w-max sm:w-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">Barchasi</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm">Kutilmoqda</TabsTrigger>
                <TabsTrigger value="processing" className="text-xs sm:text-sm">Jarayonda</TabsTrigger>
                <TabsTrigger value="delivered" className="text-xs sm:text-sm">Yetkazildi</TabsTrigger>
                <TabsTrigger value="cancelled" className="text-xs sm:text-sm">Bekor</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-4">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Buyurtmalar topilmadi</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium">{order.order_number || order.id.slice(0, 8)}</span>
                        <Badge variant={statusConfig[order.status]?.color || 'secondary'} className="text-xs">
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{order.customer?.full_name || "Noma'lum"}</span>
                        <span className="text-muted-foreground"> • {order.shop?.name || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{formatPrice(order.total_amount)}</span>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {
                          setSelectedOrder(order)
                          setNewStatus(order.status)
                          setStatusDialogOpen(true)
                        }}>Status</Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('uz-UZ')} • {order.payment_method || 'Naqd'}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyurtma ID</TableHead>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Do'kon</TableHead>
                    <TableHead>Summa</TableHead>
                    <TableHead>To'lov</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Buyurtmalar topilmadi</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.order_number || order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer?.full_name || "Noma'lum"}</div>
                            <div className="text-sm text-muted-foreground">{order.customer?.phone || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{order.shop?.name || '-'}</TableCell>
                        <TableCell className="font-medium">{formatPrice(order.total_amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.payment_method || 'Naqd'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[order.status]?.color || 'secondary'}>
                            {statusConfig[order.status]?.label || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(order.created_at).toLocaleDateString('uz-UZ')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setNewStatus(order.status)
                              setStatusDialogOpen(true)
                            }}
                          >
                            Status
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buyurtma statusini o'zgartirish</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number || selectedOrder?.id?.slice(0, 8)} raqamli buyurtma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Yangi statusni tanlang:</p>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Kutilmoqda</SelectItem>
                  <SelectItem value="processing">Jarayonda</SelectItem>
                  <SelectItem value="shipped">Yo'lda</SelectItem>
                  <SelectItem value="delivered">Yetkazildi</SelectItem>
                  <SelectItem value="cancelled">Bekor qilindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleStatusChange} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
