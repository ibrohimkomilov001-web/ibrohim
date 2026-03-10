'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, Dices, Trash2, Pencil, Trophy, Gift, Percent, Truck, X, History, Calendar } from 'lucide-react'
import { StatCard } from '@/components/charts'
import { toast } from 'sonner'
import { useTranslation } from '@/store/locale-store';
import {
  getPrizes,
  createPrize,
  updatePrize,
  deletePrize,
  getSpins,
  type LuckyWheelPrize,
  type PrizeType,
} from './actions'

const PRIZE_TYPE_LABELS: Record<PrizeType, string> = {
  discount_percent: 'discountPercentType',
  discount_fixed: 'discountFixedType',
  free_delivery: 'freeDelivery',
  physical_gift: 'physicalGift',
  nothing: 'nothingPrize',
}

const PRIZE_TYPE_ICONS: Record<PrizeType, typeof Percent> = {
  discount_percent: Percent,
  discount_fixed: Percent,
  free_delivery: Truck,
  physical_gift: Gift,
  nothing: X,
}

const emptyForm = {
  nameUz: '',
  nameRu: '',
  type: 'discount_percent' as PrizeType,
  value: '',
  probability: '',
  color: '#4CAF50',
  promoCodePrefix: '',
  stock: '',
  sortOrder: '',
  isActive: true,
}

export default function AdminLuckyWheelPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient()

  // UI state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPrize, setEditingPrize] = useState<LuckyWheelPrize | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [spinsPage, setSpinsPage] = useState(1)

  // Data queries
  const { data: prizesData, isLoading: loading } = useQuery({
    queryKey: ['lucky-wheel', 'prizes'],
    queryFn: () => getPrizes(),
  })

  const prizes = prizesData?.prizes ?? []
  const stats = prizesData?.stats ?? { totalSpins: 0, todaySpins: 0, totalWinners: 0 }

  const { data: spinsData, isLoading: spinsLoading } = useQuery({
    queryKey: ['lucky-wheel', 'spins', spinsPage],
    queryFn: () => getSpins({ page: spinsPage, limit: 20 }),
    enabled: historyOpen,
  })

  const spins = spinsData?.spins ?? []
  const spinsPagination = spinsData?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 }

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (params: { id?: string; payload: Partial<LuckyWheelPrize> }) => {
      if (params.id) {
        await updatePrize(params.id, params.payload)
      } else {
        await createPrize(params.payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lucky-wheel', 'prizes'] })
      toast.success(editingPrize ? t('prizeUpdated') : t('prizeAdded'))
      setDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || t('saveError'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePrize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lucky-wheel', 'prizes'] })
      toast.success(t('prizeDeleted'))
    },
    onError: () => {
      toast.error(t('deleteError'))
    },
  })

  const actionLoading = saveMutation.isPending

  const openCreate = () => {
    setEditingPrize(null)
    setFormData({ ...emptyForm, sortOrder: String(prizes.length + 1) })
    setDialogOpen(true)
  }

  const openEdit = (prize: LuckyWheelPrize) => {
    setEditingPrize(prize)
    setFormData({
      nameUz: prize.nameUz,
      nameRu: prize.nameRu,
      type: prize.type,
      value: prize.value || '',
      probability: String(prize.probability),
      color: prize.color,
      promoCodePrefix: prize.promoCodePrefix || '',
      stock: prize.stock !== null ? String(prize.stock) : '',
      sortOrder: String(prize.sortOrder),
      isActive: prize.isActive,
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.nameUz || !formData.probability) {
      toast.error(t('nameAndProbabilityRequired'))
      return
    }

    const payload = {
      nameUz: formData.nameUz,
      nameRu: formData.nameRu,
      type: formData.type,
      value: formData.value || null,
      probability: parseFloat(formData.probability),
      color: formData.color,
      promoCodePrefix: formData.promoCodePrefix || null,
      stock: formData.stock ? parseInt(formData.stock) : null,
      sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : 0,
      isActive: formData.isActive,
    }

    saveMutation.mutate({ id: editingPrize?.id, payload })
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('confirmDeletePrize'))) return
    deleteMutation.mutate(id)
  }

  const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('luckyWheelTitle')}</h1>
          <p className="text-muted-foreground">{t('luckyWheelDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setHistoryOpen(true); setSpinsPage(1) }}>
            <History className="h-4 w-4 mr-2" />
            {t('history')}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addPrize')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Dices} label={t('totalSpins')} value={stats.totalSpins} color="primary" />
        <StatCard icon={Calendar} label={t('today')} value={stats.todaySpins} color="info" />
        <StatCard icon={Trophy} label={t('winners')} value={stats.totalWinners} color="success" />
        <StatCard icon={Percent} label={t('totalProbability')} value={`${(totalProbability * 100).toFixed(1)}%`} color="warning" />
      </div>

      {/* Prizes List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('prizesCount')} ({prizes.length})</CardTitle>
          <CardDescription>{t('segmentsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {prizes.map((prize) => {
              const Icon = PRIZE_TYPE_ICONS[prize.type] || Gift
              return (
                <div key={prize.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: prize.color + '20', color: prize.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {prize.nameUz}
                        {!prize.isActive && <Badge variant="secondary">{t('disabled')}</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>{t(PRIZE_TYPE_LABELS[prize.type])}</span>
                        {prize.value && <span>• {t('value')}: {prize.value}</span>}
                        <span>• {t('probabilityLabel')}: {(prize.probability * 100).toFixed(1)}%</span>
                        {prize.stock !== null && <span>• {t('remaining')}: {prize.stock}</span>}
                        <span>• {t('totalWon')}: {prize.totalWon}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(prize)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(prize.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
            {prizes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('noPrizesYet')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPrize ? t('editPrize') : t('newPrize')}</DialogTitle>
            <DialogDescription>{t('segmentDetails')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('nameUz')} *</Label>
                <Input
                  value={formData.nameUz}
                  onChange={(e) => setFormData(f => ({ ...f, nameUz: e.target.value }))}
                  placeholder="5% chegirma"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('nameRu')}</Label>
                <Input
                  value={formData.nameRu}
                  onChange={(e) => setFormData(f => ({ ...f, nameRu: e.target.value }))}
                  placeholder="Скидка 5%"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('typeLabel')} *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData(f => ({ ...f, type: v as PrizeType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIZE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{t(label)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('value')} {formData.type === 'discount_percent' ? '(%)' : formData.type === 'discount_fixed' ? `(${t('valueSom')})` : ''}</Label>
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData(f => ({ ...f, value: e.target.value }))}
                  placeholder={formData.type === 'nothing' ? t('notNeeded') : '10'}
                  disabled={formData.type === 'nothing' || formData.type === 'free_delivery'}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('probabilityRange')}</Label>
                <Input
                  value={formData.probability}
                  onChange={(e) => setFormData(f => ({ ...f, probability: e.target.value }))}
                  placeholder="0.25"
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('color')}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(f => ({ ...f, color: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(f => ({ ...f, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('sortOrder')}</Label>
                <Input
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(f => ({ ...f, sortOrder: e.target.value }))}
                  type="number"
                />
              </div>
            </div>

            {(formData.type === 'discount_percent' || formData.type === 'discount_fixed' || formData.type === 'free_delivery') && (
              <div className="space-y-2">
                <Label>{t('promoCodePrefix')}</Label>
                <Input
                  value={formData.promoCodePrefix}
                  onChange={(e) => setFormData(f => ({ ...f, promoCodePrefix: e.target.value }))}
                  placeholder="WHEEL5"
                />
              </div>
            )}

            {formData.type === 'physical_gift' && (
              <div className="space-y-2">
                <Label>{t('stock')}</Label>
                <Input
                  value={formData.stock}
                  onChange={(e) => setFormData(f => ({ ...f, stock: e.target.value }))}
                  type="number"
                  placeholder="5"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData(f => ({ ...f, isActive: v }))}
              />
              <Label>{t('activeSwitch')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPrize ? t('save') : t('add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spin History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('spinHistory')}</DialogTitle>
            <DialogDescription>{t('recentSpins')}</DialogDescription>
          </DialogHeader>

          {spinsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {spins.map((spin) => (
                <div key={spin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: spin.prize.color }}
                    >
                      {spin.prizeName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{spin.user.fullName || spin.user.phone}</div>
                      <div className="text-xs text-muted-foreground">
                        {spin.prizeName}
                        {spin.promoCode && <span className="ml-2 font-mono text-primary">{spin.promoCode}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(spin.createdAt).toLocaleString('uz-UZ')}
                  </div>
                </div>
              ))}
              {spins.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">{t('historyEmpty')}</div>
              )}

              {/* Pagination */}
              {spinsPagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={spinsPage <= 1}
                    onClick={() => setSpinsPage(p => p - 1)}
                  >
                    {t('previous')}
                  </Button>
                  <span className="flex items-center text-sm text-muted-foreground">
                    {spinsPage} / {spinsPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={spinsPage >= spinsPagination.totalPages}
                    onClick={() => setSpinsPage(p => p + 1)}
                  >
                    {t('next')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}