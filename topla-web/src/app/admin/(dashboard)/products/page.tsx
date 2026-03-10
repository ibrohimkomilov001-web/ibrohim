'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Package, Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getProducts, approveProduct, rejectProduct, deleteProduct, type Product } from './actions'
import { toast } from 'sonner'
import { useUrlState } from '@/hooks/use-url-state'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { DataTablePagination, type PaginationMeta } from '@/components/ui/data-table-pagination'
import { useTranslation } from '@/store/locale-store'

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  draft: 'outline',
}

const statusLabels: Record<string, string> = {
  pending: 'Kutilmoqda',
  approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
  draft: 'Qoralama',
}

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [{ search: searchQuery, tab: activeTab, page }, setFilters] = useUrlState({ search: '', tab: 'pending', page: '1' })
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-products', debouncedSearch, activeTab, page],
    queryFn: () => getProducts({
      page: parseInt(page) || 1,
      search: debouncedSearch || undefined,
      status: activeTab !== 'all' ? activeTab : undefined,
    }),
    staleTime: 15_000,
  });

  const products = data?.products ?? [];
  const stats = data?.stats ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false };

  const loadData = () => queryClient.invalidateQueries({ queryKey: ['admin-products'] });

  const handleApprove = async (productId: string) => {
    try {
      setActionLoading(true)
      await approveProduct(productId)
      await loadData()
      toast.success(t('approved'))
    } catch (error) {
      toast.error(t('errorOccurred'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedProduct || !rejectReason) return

    try {
      setActionLoading(true)
      await rejectProduct(selectedProduct.id, rejectReason)
      await loadData()
      toast.success(t('rejected'))
      setRejectDialogOpen(false)
      setRejectReason('')
      setSelectedProduct(null)
    } catch (error) {
      toast.error(t('errorOccurred'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm(t('confirmDelete'))) return

    try {
      await deleteProduct(productId)
      await loadData()
      toast.success(t('deleted'))
    } catch (error) {
      toast.error(t('errorOccurred'))
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t('moderation')}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Vendorlar tomonidan qo'shilgan mahsulotlarni tekshiring
          </p>
        </div>
        {stats.pending > 0 && (
          <Badge variant="destructive" className="text-sm sm:text-lg px-3 py-1 sm:px-4 sm:py-2 w-fit">
            {stats.pending} {t('pending')}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">{t('products')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t('moderation')}</CardDescription>
            </div>
            <Input
              placeholder={t('searchPlaceholderGeneric')}
              value={searchQuery}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 sm:pt-0">
          <Tabs value={activeTab} onValueChange={(v) => setFilters({ tab: v })}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex w-max sm:w-auto">
                <TabsTrigger value="pending" className="text-xs sm:text-sm">
                  {t('pending')}
                  <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
                    {stats.pending}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm">{t('approved')}</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs sm:text-sm">{t('rejected')}</TabsTrigger>
                <TabsTrigger value="all" className="text-xs sm:text-sm">{t('all')}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-4">
              <div className="relative">
              {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {products.length === 0 && !loading ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">{t('noItems')}</p>
                  </div>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.thumbnail_url ? (
                            <img src={product.thumbnail_url} alt={product.name_uz} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{product.name_uz}</div>
                          <div className="text-xs text-muted-foreground">{product.shop?.name || t('noData')}</div>
                        </div>
                        <Badge variant={statusColors[product.status] || "secondary"} className="text-xs flex-shrink-0">
                          {statusLabels[product.status] || product.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">{formatPrice(product.price)}</span>
                        <span className="text-xs text-muted-foreground">{product.category?.name_uz || "-"}</span>
                      </div>
                      {product.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApprove(product.id)} disabled={actionLoading}>
                            <CheckCircle className="h-3 w-3 mr-1" />{t('approve')}
                          </Button>
                          <Button variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setSelectedProduct(product); setRejectDialogOpen(true); }}>
                            <XCircle className="h-3 w-3 mr-1" />{t('reject')}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('product')}</TableHead>
                    <TableHead>{t('shop')}</TableHead>
                    <TableHead>{t('category')}</TableHead>
                    <TableHead>{t('price')}</TableHead>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">{t('noItems')}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                              {product.thumbnail_url ? (
                                <img src={product.thumbnail_url} alt={product.name_uz} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">📦</span>
                              )}
                            </div>
                            <span className="font-medium">{product.name_uz}</span>
                          </div>
                        </TableCell>
                        <TableCell>{product.shop?.name || t('noData')}</TableCell>
                        <TableCell>{product.category?.name_uz || "-"}</TableCell>
                        <TableCell className="font-medium">{formatPrice(product.price)}</TableCell>
                        <TableCell>{product.created_at ? new Date(product.created_at).toLocaleDateString("uz-UZ") : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[product.status] || "secondary"}>
                            {statusLabels[product.status] || product.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {product.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApprove(product.id)}
                                  disabled={actionLoading}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {t('approve')}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setRejectDialogOpen(true)
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  {t('reject')}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
              <DataTablePagination pagination={pagination} onPageChange={(p) => setFilters({ page: String(p) })} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reject')}</DialogTitle>
            <DialogDescription>
              "{selectedProduct?.name_uz}" mahsulotini rad etish sababini kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select onValueChange={setRejectReason}>
              <SelectTrigger>
                <SelectValue placeholder="Sabab tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sifatsiz rasm">Sifatsiz rasm</SelectItem>
                <SelectItem value="Noto'g'ri kategoriya">Noto'g'ri kategoriya</SelectItem>
                <SelectItem value="Nomaqbul kontent">Nomaqbul kontent</SelectItem>
                <SelectItem value="Takroriy mahsulot">Takroriy mahsulot</SelectItem>
                <SelectItem value="Narx muammosi">Narx muammosi</SelectItem>
                <SelectItem value="Boshqa">Boshqa</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Qo'shimcha izoh (ixtiyoriy)"
              onChange={(e) => setRejectReason(prev => prev + (e.target.value ? `: ${e.target.value}` : ''))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
