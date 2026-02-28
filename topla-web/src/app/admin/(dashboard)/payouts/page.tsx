'use client'

import { useState, useEffect, useCallback } from 'react'
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
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Kutilmoqda' },
  processing: { color: 'bg-blue-100 text-blue-800', label: 'Jarayonda' },
  completed: { color: 'bg-green-100 text-green-800', label: "To'landi" },
  failed: { color: 'bg-red-100 text-red-800', label: 'Rad etildi' },
}

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

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

  const loadPayouts = useCallback(async () => {
    setIsLoading(true)
    try {
      const status = activeTab !== 'all' ? activeTab : undefined
      const result = await fetchPayouts({ status })
      const data = result?.data || result
      const items = data?.items || data?.payouts || (Array.isArray(data) ? data : [])
      setPayouts(items)
      setPagination(data?.pagination || { total: items.length, totalPages: 1 })
    } catch (err: any) {
      toast.error(err.message || "To'lovlarni yuklashda xatolik")
      setPayouts([])
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadPayouts()
  }, [loadPayouts])

  const handleApprove = async () => {
    if (!selectedPayout) return
    setIsProcessing(true)
    try {
      await processPayout(selectedPayout.id, { status: 'completed' })
      toast.success("To'lov tasdiqlandi")
      setApproveDialogOpen(false)
      setSelectedPayout(null)
      loadPayouts()
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi")
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
      toast.success("To'lov rad etildi")
      setRejectDialogOpen(false)
      setSelectedPayout(null)
      setRejectReason('')
      loadPayouts()
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi")
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
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">To&apos;lovlar (Payouts)</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Vendorlarga to&apos;lovlarni boshqaring
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kutilmoqda</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatPrice(totalPending)}</div>
            <p className="text-xs text-muted-foreground">{pendingCount} ta so&apos;rov</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To&apos;langan</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(totalCompleted)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami so&apos;rovlar</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>To&apos;lov so&apos;rovlari</CardTitle>
            <CardDescription>Vendorlardan kelgan pul yechish so&apos;rovlari</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Kutilmoqda
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">To&apos;langan</TabsTrigger>
              <TabsTrigger value="failed">Rad etilgan</TabsTrigger>
              <TabsTrigger value="all">Barchasi</TabsTrigger>
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
                  To&apos;lovlar topilmadi
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {payouts.map((payout) => (
                      <div key={payout.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{payout.shop?.name || '—'}</span>
                          <Badge className={statusConfig[payout.status]?.color || 'bg-gray-100 text-gray-800'} >
                            {statusConfig[payout.status]?.label || payout.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-green-600">{formatPrice(Number(payout.amount))}</span>
                          <span className="text-xs text-muted-foreground">{payout.cardNumber || '—'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDate(payout.createdAt)}</div>
                        {payout.status === 'pending' && (
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => { setSelectedPayout(payout); setApproveDialogOpen(true) }}>✓ To&apos;lash</Button>
                            <Button variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setSelectedPayout(payout); setRejectDialogOpen(true) }}>✕ Rad etish</Button>
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
                          <TableHead>Do&apos;kon</TableHead>
                          <TableHead>Summa</TableHead>
                          <TableHead>Karta</TableHead>
                          <TableHead>Sana</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amallar</TableHead>
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
                              <Badge className={statusConfig[payout.status]?.color || 'bg-gray-100 text-gray-800'}>
                                {statusConfig[payout.status]?.label || payout.status}
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
                                    ✓ To&apos;lash
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPayout(payout)
                                      setRejectDialogOpen(true)
                                    }}
                                  >
                                    ✕ Rad etish
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
            <DialogTitle>To&apos;lovni tasdiqlash</DialogTitle>
            <DialogDescription>
              {selectedPayout?.shop?.name} ga {formatPrice(Number(selectedPayout?.amount || 0))} to&apos;lashni tasdiqlaysizmi?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Do&apos;kon:</span>
              <span>{selectedPayout?.shop?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Karta:</span>
              <span>{selectedPayout?.cardNumber || '—'}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>To&apos;lanadigan summa:</span>
              <span className="text-green-600">{formatPrice(Number(selectedPayout?.amount || 0))}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isProcessing}>
              Bekor qilish
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={isProcessing}
            >
              {isProcessing ? 'Yuklanmoqda...' : "To'lovni tasdiqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>To&apos;lovni rad etish</DialogTitle>
            <DialogDescription>
              {selectedPayout?.shop?.name} ning to&apos;lov so&apos;rovini rad etish sababini kiriting
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Sabab (masalan: Noto'g'ri karta ma'lumotlari)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isProcessing}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? 'Yuklanmoqda...' : 'Rad etish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
