'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, Ticket, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getPromoCodes, createPromoCode, togglePromoCodeStatus, deletePromoCode, type PromoCode } from './actions'
import { toast } from 'sonner'
import { useUrlState } from '@/hooks/use-url-state'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { DataTablePagination, type PaginationMeta } from '@/components/ui/data-table-pagination'

export default function AdminPromoCodesPage() {
  const [loading, setLoading] = useState(true)
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false })
  const [{ search: searchQuery, page }, setFilters] = useUrlState({ search: '', page: '1' })
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    start_date: '',
    end_date: ''
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const { codes: codesData, pagination: pag } = await getPromoCodes({
        page: parseInt(page) || 1,
        search: debouncedSearch || undefined,
      })
      setCodes(codesData)
      setPagination(pag)
    } catch (error) {
      console.error(error)
      toast.error("Ma'lumotlarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const p = parseInt(page)
    if (p > 1) setFilters({ page: '1' })
  }, [debouncedSearch])

  const handleCreate = async () => {
    if (!formData.code || !formData.discount_value) {
      toast.error("Kod va chegirma qiymatini kiriting")
      return
    }

    try {
      setActionLoading(true)
      await createPromoCode({
        code: formData.code,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : undefined,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : undefined,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined
      })
      await loadData()
      toast.success("Promo kod yaratildi")
      setCreateDialogOpen(false)
      setFormData({
        code: '', description: '', discount_type: 'percentage', discount_value: '',
        min_order_amount: '', max_discount_amount: '', usage_limit: '', start_date: '', end_date: ''
      })
    } catch (error) {
      toast.error("Promo kod yaratishda xatolik")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await togglePromoCodeStatus(id, !isActive)
      await loadData()
      toast.success(isActive ? "Promo kod o'chirildi" : "Promo kod yoqildi")
    } catch (error) {
      toast.error("Statusni o'zgartirishda xatolik")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Promo kodni o'chirishni xohlaysizmi?")) return
    try {
      await deletePromoCode(id)
      await loadData()
      toast.success("Promo kod o'chirildi")
    } catch (error) {
      toast.error("O'chirishda xatolik")
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Promo Kodlar</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Chegirma kodlarini boshqaring ({pagination.total} ta)</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi kod
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Promo kodlar ro'yxati</CardTitle>
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="relative">
          {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {codes.length === 0 && !loading ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Promo kodlar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {codes.map((code) => (
                <div key={code.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-sm sm:text-base font-bold">
                        {code.code}
                      </code>
                      <Badge variant={code.is_active ? 'default' : 'secondary'}>
                        {code.is_active ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(code.id, code.is_active)}>
                        {code.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(code.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{code.description || 'Tavsif yo\'q'}</p>
                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                    <span className="bg-muted px-2 py-1 rounded">
                      {code.discount_type === 'percentage' ? `${code.discount_value}%` : formatPrice(code.discount_value)}
                    </span>
                    {(code.min_order_amount ?? 0) > 0 && (
                      <span className="bg-muted px-2 py-1 rounded">Min: {formatPrice(code.min_order_amount!)}</span>
                    )}
                    {code.usage_limit && (
                      <span className="bg-muted px-2 py-1 rounded">Limit: {code.used_count}/{code.usage_limit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DataTablePagination pagination={pagination} onPageChange={(p) => setFilters({ page: String(p) })} />
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi promo kod</DialogTitle>
            <DialogDescription>Yangi chegirma kodini yarating</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kod *</Label>
              <Input
                placeholder="CHEGIRMA20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Input
                placeholder="20% chegirma"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turi</Label>
                <Select value={formData.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Foiz (%)</SelectItem>
                    <SelectItem value="fixed">Qat'iy summa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Qiymat *</Label>
                <Input
                  type="number"
                  placeholder={formData.discount_type === 'percentage' ? '20' : '50000'}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min. buyurtma</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ishlatish limiti</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
