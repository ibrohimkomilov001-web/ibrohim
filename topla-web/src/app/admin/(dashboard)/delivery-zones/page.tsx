'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, MapPin, Trash2, ToggleLeft, ToggleRight, Edit, CheckCircle, XCircle } from 'lucide-react'
import { StatCard } from '@/components/charts'
import { formatPrice } from '@/lib/utils'
import { getDeliveryZonesWithStats, createDeliveryZone, toggleDeliveryZoneStatus, deleteDeliveryZone, type DeliveryZone } from './actions'
import { toast } from 'sonner'
import { useUrlState } from '@/hooks/use-url-state'
import { useTranslation } from '@/store/locale-store'

export default function AdminDeliveryZonesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [{ search: searchQuery }, setFilters] = useUrlState({ search: '' })
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    region: '',
    districts: '',
    delivery_fee: '',
    min_order_amount: '',
    estimated_time: ''
  })

  const { data, isLoading } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: getDeliveryZonesWithStats,
  })

  const zones = data?.zones ?? []
  const stats = data?.stats ?? { total: 0, active: 0, inactive: 0 }

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    zone.region?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const createMutation = useMutation({
    mutationFn: createDeliveryZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      toast.success(t('zoneCreated'))
      setCreateDialogOpen(false)
      setFormData({ name: '', region: '', districts: '', delivery_fee: '', min_order_amount: '', estimated_time: '' })
    },
    onError: () => {
      toast.error(t('zoneCreateError'))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleDeliveryZoneStatus(id, !isActive),
    onSuccess: (_data, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      toast.success(isActive ? t('zoneDeactivated') : t('zoneActivated'))
    },
    onError: () => {
      toast.error(t('statusChangeError'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDeliveryZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      toast.success(t('zoneDeleted'))
    },
    onError: () => {
      toast.error(t('deleteError'))
    },
  })

  const handleCreate = () => {
    if (!formData.name) {
      toast.error(t('zoneNameRequired'))
      return
    }
    createMutation.mutate({
      name: formData.name,
      region: formData.region || undefined,
      districts: formData.districts ? formData.districts.split(',').map(d => d.trim()) : [],
      delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : 0,
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
      estimated_time: formData.estimated_time || undefined
    })
  }

  const handleToggle = (id: string, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive })
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('confirmDeleteZone'))) return
    deleteMutation.mutate(id)
  }

  if (isLoading) {
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
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t('deliveryZonesTitle')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('manageDeliveryZones')}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('newZone')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard icon={MapPin} label={t('total')} value={stats.total} color="primary" />
        <StatCard icon={CheckCircle} label={t('active')} value={stats.active} color="success" />
        <StatCard icon={XCircle} label={t('inactive')} value={stats.inactive} color="warning" />
      </div>

      {/* Zones List */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">{t('zonesList')}</CardTitle>
            <Input
              placeholder={t('searchPlaceholderGeneric')}
              value={searchQuery}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          {filteredZones.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">{t('zonesNotFound')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredZones.map((zone) => (
                <div key={zone.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="font-medium">{zone.name}</span>
                      <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                        {zone.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(zone.id, zone.is_active)}>
                        {zone.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(zone.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {zone.region && <p className="text-sm text-muted-foreground">{zone.region}</p>}
                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                    <span className="bg-muted px-2 py-1 rounded">
                      {t('delivery')}: {zone.delivery_fee > 0 ? formatPrice(zone.delivery_fee) : t('free')}
                    </span>
                    {zone.min_order_amount > 0 && (
                      <span className="bg-muted px-2 py-1 rounded">Min: {formatPrice(zone.min_order_amount)}</span>
                    )}
                    {zone.estimated_time && (
                      <span className="bg-muted px-2 py-1 rounded">⏱️ {zone.estimated_time}</span>
                    )}
                  </div>
                  {zone.districts && zone.districts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {zone.districts.map((d, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('newZone')}</DialogTitle>
            <DialogDescription>{t('createNewZoneDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('zoneName')} *</Label>
              <Input
                placeholder="Toshkent shahri"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('region')}</Label>
              <Input
                placeholder="Toshkent"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('districtsComma')}</Label>
              <Input
                placeholder="Yunusobod, Mirzo Ulug'bek, Shayxontohur"
                value={formData.districts}
                onChange={(e) => setFormData({ ...formData, districts: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('deliveryPrice')}</Label>
                <Input
                  type="number"
                  placeholder="15000"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('estimatedTime')}</Label>
                <Input
                  placeholder="30-60 min"
                  value={formData.estimated_time}
                  onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
