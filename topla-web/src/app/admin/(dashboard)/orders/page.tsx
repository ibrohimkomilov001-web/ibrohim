'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getOrders, updateOrderStatus, type Order } from './actions'
import { toast } from 'sonner'
import { useUrlState } from '@/hooks/use-url-state'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { DataTablePagination, type PaginationMeta } from '@/components/ui/data-table-pagination'
import { useTranslation } from '@/store/locale-store'

const statusConfig: Record<string, { color: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { color: 'secondary', label: 'Kutilmoqda' },
  processing: { color: 'default', label: 'Tayyorlanmoqda' },
  ready_for_pickup: { color: 'outline', label: 'Tayyor - kuryerga berish' },
  courier_assigned: { color: 'outline', label: 'Kuryer tayinlandi' },
  courier_picked_up: { color: 'outline', label: 'Kuryer oldi' },
  shipping: { color: 'outline', label: 'Yetkazilmoqda' },
  at_pickup_point: { color: 'outline', label: 'Punktda kutmoqda' },
  delivered: { color: 'default', label: 'Yetkazildi' },
  cancelled: { color: 'destructive', label: 'Bekor qilindi' },
}

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [{ search: searchQuery, tab: activeTab, page }, setFilters] = useUrlState({ search: '', tab: 'all', page: '1' })
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-orders', debouncedSearch, activeTab, page],
    queryFn: () => getOrders({
      search: debouncedSearch || undefined,
      status: activeTab !== 'all' ? activeTab : undefined,
      page: parseInt(page) || 1,
    }),
    staleTime: 10_000,
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false };

  const loadData = () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] });

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return
    try {
      setActionLoading(true)
      await updateOrderStatus(selectedOrder.id, newStatus)
      await loadData()
      toast.success(t('updated'))
      setStatusDialogOpen(false)
      setSelectedOrder(null)
      setNewStatus('')
    } catch {
      toast.error(t('errorOccurred'))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t('orders')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('orders')} ({pagination.total})
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{t('orders')}</CardTitle>
                <CardDescription>{t('orders')}</CardDescription>
              </div>
              <Input
                placeholder={t('searchPlaceholderGeneric')}
                value={searchQuery}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full sm:w-80"
              />
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setFilters({ tab: v })}>
              <div className="overflow-x-auto pb-2">
                <TabsList className="inline-flex w-max sm:w-auto">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">{t('all')}</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs sm:text-sm">{t('pending')}</TabsTrigger>
                  <TabsTrigger value="processing" className="text-xs sm:text-sm">{t('processing')}</TabsTrigger>
                  <TabsTrigger value="shipping" className="text-xs sm:text-sm">{t('shipped')}</TabsTrigger>
                  <TabsTrigger value="delivered" className="text-xs sm:text-sm">{t('delivered')}</TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-xs sm:text-sm">{t('cancelled')}</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">{t('noItems')}</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium">{order.order_number || order.id.slice(0, 8)}</span>
                        <Badge variant={statusConfig[order.status]?.color || 'secondary'} className="text-xs">
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{order.customer?.full_name || t('noData')}</span>
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
                    <TableHead>{t('id')}</TableHead>
                    <TableHead>{t('buyer')}</TableHead>
                    <TableHead>{t('shop')}</TableHead>
                    <TableHead>{t('amount')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">{t('noItems')}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.order_number || order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer?.full_name || t('noData')}</div>
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
              <DataTablePagination
                pagination={pagination}
                onPageChange={(p) => setFilters({ page: String(p) })}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('status')}</DialogTitle>
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
                  <SelectItem value="processing">Tayyorlanmoqda</SelectItem>
                  <SelectItem value="ready_for_pickup">Tayyor - kuryerga berish</SelectItem>
                  <SelectItem value="courier_assigned">Kuryer tayinlandi</SelectItem>
                  <SelectItem value="courier_picked_up">Kuryer oldi</SelectItem>
                  <SelectItem value="shipping">Yetkazilmoqda</SelectItem>
                  <SelectItem value="at_pickup_point">Punktda kutmoqda</SelectItem>
                  <SelectItem value="delivered">Yetkazildi</SelectItem>
                  <SelectItem value="cancelled">Bekor qilindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleStatusChange} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
