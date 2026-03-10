'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchPayouts, processPayout } from '@/lib/api/admin'
import { toast } from 'sonner'
import { useTranslation } from '@/store/locale-store';
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, CheckCircle2, BarChart3 } from 'lucide-react'
import { StatCard } from '@/components/charts'

interface Payout {
  id: string
  amount: number
  cardNumber?: string
  status: string
  note?: string
  createdAt: string
  processedAt?: string
  shop?: {
    name: string
    balance?: number
  }
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', label: 'pending' },
  processing: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', label: 'inProcess' },
  completed: { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', label: 'paid' },
  failed: { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', label: 'rejected' },
}

export default function AdminPayoutsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['admin-payouts', activeTab],
    queryFn: async () => {
      const status = activeTab !== 'all' ? activeTab : undefined
      const result = await fetchPayouts({ status })
      const data = result?.data || result
      const items = data?.items || data?.payouts || (Array.isArray(data) ? data : [])
      return { items, pagination: data?.pagination || { total: items.length, totalPages: 1 } }
    },
    staleTime: 10_000,
  })

  const payouts: Payout[] = queryData?.items || []
  const pagination = queryData?.pagination || { total: 0, totalPages: 1 }

  const loadPayouts = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleApprove = async () => {
    if (!selectedPayout) return
    setIsProcessing(true)
    try {
      await processPayout(selectedPayout.id, { status: 'completed' })
      toast.success(t('payoutApproved'))
      setApproveDialogOpen(false)
      setSelectedPayout(null)
      loadPayouts()
    } catch (err: any) {
      toast.error(err.message || t('errorHappened'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedPayout) return
    setIsProcessing(true)
    try {
      await processPayout(selectedPayout.id, {
        status: 'failed',
        rejectionReason: rejectReason || undefined,
      })
      toast.success(t('payoutRejected'))
      setRejectDialogOpen(false)
      setSelectedPayout(null)
      setRejectReason('')
      loadPayouts()
    } catch (err: any) {
      toast.error(err.message || t('errorHappened'))
    } finally {
      setIsProcessing(false)
    }
  }

  const pendingCount = payouts.filter(p => p.status === 'pending').length
  const totalPending = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalCompleted = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount || 0), 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t('payoutsTitle')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('vendorPayments')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3">
        <StatCard icon={Clock} label={t('pending')} value={formatPrice(totalPending)} color="warning" />
        <StatCard icon={CheckCircle2} label={t('paid')} value={formatPrice(totalCompleted)} color="success" />
        <StatCard icon={BarChart3} label={t('totalRequests')} value={pagination.total} color="primary" />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('payoutRequests')}</CardTitle>
            <CardDescription>{t('payoutRequestsDesc')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="overflow-x-auto w-full justify-start">
              <TabsTrigger value="pending">
                {t('pending')}
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">{t('paid')}</TabsTrigger>
              <TabsTrigger value="failed">{t('rejected')}</TabsTrigger>
              <TabsTrigger value="all">{t('all')}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 p-4">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : payouts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t('payoutsNotFound')}
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {payouts.map((payout) => (
                      <div key={payout.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{payout.shop?.name || '—'}</span>
                          <Badge className={statusConfig[payout.status]?.color || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'} >
                            {t(statusConfig[payout.status]?.label || payout.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-green-600">{formatPrice(Number(payout.amount))}</span>
                          <span className="text-xs text-muted-foreground">{payout.cardNumber || '—'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDate(payout.createdAt)}</div>
                        {payout.status === 'pending' && (
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => { setSelectedPayout(payout); setApproveDialogOpen(true) }}>✓ {t('payButtonApprove')}</Button>
                            <Button variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setSelectedPayout(payout); setRejectDialogOpen(true) }}>✕ {t('rejectButton')}</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('shop')}</TableHead>
                          <TableHead>{t('amount')}</TableHead>
                          <TableHead>{t('card')}</TableHead>
                          <TableHead>{t('date')}</TableHead>
                          <TableHead>{t('status')}</TableHead>
                          <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell className="font-medium">
                              {payout.shop?.name || '—'}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatPrice(Number(payout.amount))}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {payout.cardNumber || '—'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(payout.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusConfig[payout.status]?.color || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'}>
                                {t(statusConfig[payout.status]?.label || payout.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {payout.status === 'pending' && (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      setSelectedPayout(payout)
                                      setApproveDialogOpen(true)
                                    }}
                                  >
                                    ✓ {t('payButtonApprove')}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPayout(payout)
                                      setRejectDialogOpen(true)
                                    }}
                                  >
                                    ✕ {t('rejectButton')}
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmPayment')}</DialogTitle>
            <DialogDescription>
              {selectedPayout?.shop?.name} {t('confirmPaymentDesc')} ({formatPrice(Number(selectedPayout?.amount || 0))})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('shop')}:</span>
              <span>{selectedPayout?.shop?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('card')}:</span>
              <span>{selectedPayout?.cardNumber || '—'}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{t('payableAmount')}:</span>
              <span className="text-green-600">{formatPrice(Number(selectedPayout?.amount || 0))}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isProcessing}>
              {t('cancel')}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={isProcessing}
            >
              {isProcessing ? t('loading') : t('confirmPayment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectPayment')}</DialogTitle>
            <DialogDescription>
              {t('rejectPaymentDesc')}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t('rejectReasonPlaceholder')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isProcessing}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? t('loading') : t('rejectButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}