'use client'

import { useState, useEffect } from 'react'
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
import { getProducts, getProductStats, approveProduct, rejectProduct, deleteProduct, type Product } from './actions'
import { useToast } from '@/components/ui/use-toast'

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
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsData, statsData] = await Promise.all([
        getProducts(),
        getProductStats()
      ])
      setProducts(productsData)
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

  const filteredProducts = products.filter(product => {
    const nameStr = product.name_uz || ''
    const matchesSearch = !searchQuery || nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.shop?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || product.status === activeTab
    return matchesSearch && matchesTab
  })

  const handleApprove = async (productId: string) => {
    try {
      setActionLoading(true)
      await approveProduct(productId)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Mahsulot tasdiqlandi" })
    } catch (error) {
      toast({ title: "Xatolik", description: "Mahsulotni tasdiqlashda xatolik", variant: "destructive" })
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
      toast({ title: "Muvaffaqiyatli", description: "Mahsulot rad etildi" })
      setRejectDialogOpen(false)
      setRejectReason('')
      setSelectedProduct(null)
    } catch (error) {
      toast({ title: "Xatolik", description: "Mahsulotni rad etishda xatolik", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Mahsulotni o'chirishni xohlaysizmi?")) return

    try {
      await deleteProduct(productId)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Mahsulot o'chirildi" })
    } catch (error) {
      toast({ title: "Xatolik", description: "Mahsulotni o'chirishda xatolik", variant: "destructive" })
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Mahsulotlar Moderatsiyasi</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Vendorlar tomonidan qo'shilgan mahsulotlarni tekshiring
          </p>
        </div>
        {stats.pending > 0 && (
          <Badge variant="destructive" className="text-sm sm:text-lg px-3 py-1 sm:px-4 sm:py-2 w-fit">
            {stats.pending} ta kutilmoqda
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Barcha Mahsulotlar</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Mahsulotlarni tasdiqlang yoki rad eting</CardDescription>
            </div>
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 sm:pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex w-max sm:w-auto">
                <TabsTrigger value="pending" className="text-xs sm:text-sm">
                  Kutilmoqda
                  <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
                    {stats.pending}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm">Tasdiqlangan</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs sm:text-sm">Rad etilgan</TabsTrigger>
                <TabsTrigger value="all" className="text-xs sm:text-sm">Barchasi</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-4">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Mahsulotlar topilmadi</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.thumbnail_url ? (
                            <img src={product.thumbnail_url} alt={product.name_uz} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{product.name_uz}</div>
                          <div className="text-xs text-muted-foreground">{product.shop?.name || "Noma'lum"}</div>
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
                            <CheckCircle className="h-3 w-3 mr-1" />Tasdiqlash
                          </Button>
                          <Button variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setSelectedProduct(product); setRejectDialogOpen(true); }}>
                            <XCircle className="h-3 w-3 mr-1" />Rad etish
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
                    <TableHead>Mahsulot</TableHead>
                    <TableHead>Do'kon</TableHead>
                    <TableHead>Kategoriya</TableHead>
                    <TableHead>Narx</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Mahsulotlar topilmadi</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {product.thumbnail_url ? (
                                <img src={product.thumbnail_url} alt={product.name_uz} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">📦</span>
                              )}
                            </div>
                            <span className="font-medium">{product.name_uz}</span>
                          </div>
                        </TableCell>
                        <TableCell>{product.shop?.name || "Noma'lum"}</TableCell>
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
                                  Tasdiqlash
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
                                  Rad etish
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mahsulotni rad etish</DialogTitle>
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
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
