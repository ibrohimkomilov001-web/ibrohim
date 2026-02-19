'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Mock data
const payouts = [
  {
    id: 'PAY-001',
    shop: 'TechZone',
    owner: 'Jasur Toshmatov',
    amount: 8500000,
    commission: 850000,
    netAmount: 7650000,
    status: 'pending',
    bankName: 'Kapitalbank',
    cardNumber: '**** 4521',
    requestedAt: '2026-01-28 10:00',
  },
  {
    id: 'PAY-002',
    shop: 'MobileWorld',
    owner: 'Sardor Aliyev',
    amount: 12300000,
    commission: 1230000,
    netAmount: 11070000,
    status: 'processing',
    bankName: 'Uzcard',
    cardNumber: '**** 7832',
    requestedAt: '2026-01-27 15:30',
  },
  {
    id: 'PAY-003',
    shop: 'SportStyle',
    owner: 'Kamol Rahimov',
    amount: 3200000,
    commission: 320000,
    netAmount: 2880000,
    status: 'completed',
    bankName: 'Humo',
    cardNumber: '**** 1234',
    requestedAt: '2026-01-25 09:00',
    completedAt: '2026-01-26 14:00',
  },
  {
    id: 'PAY-004',
    shop: 'FashionHub',
    owner: 'Dilnoza Karimova',
    amount: 5600000,
    commission: 560000,
    netAmount: 5040000,
    status: 'rejected',
    bankName: 'Kapitalbank',
    cardNumber: '**** 9876',
    requestedAt: '2026-01-24 11:00',
    rejectedReason: 'Noto\'g\'ri karta ma\'lumotlari',
  },
]

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Kutilmoqda' },
  processing: { color: 'bg-blue-100 text-blue-800', label: 'Jarayonda' },
  completed: { color: 'bg-green-100 text-green-800', label: 'To\'landi' },
  rejected: { color: 'bg-red-100 text-red-800', label: 'Rad etildi' },
}

export default function AdminPayoutsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedPayout, setSelectedPayout] = useState<typeof payouts[0] | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = payout.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.shop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.owner.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || payout.status === activeTab
    return matchesSearch && matchesTab
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m'
  }

  const stats = {
    totalPending: payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.netAmount, 0),
    pendingCount: payouts.filter(p => p.status === 'pending').length,
    totalPaid: payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.netAmount, 0),
    totalCommission: payouts.reduce((sum, p) => sum + p.commission, 0),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">To'lovlar (Payouts)</h1>
        <p className="text-muted-foreground">
          Vendorlarga to'lovlarni boshqaring
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kutilmoqda</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatPrice(stats.totalPending)}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingCount} ta so'rov</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To'langan (oy)</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yig'ilgan komissiya</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalCommission)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Komissiya %</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10%</div>
            <p className="text-xs text-muted-foreground">Standart stavka</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>To'lov so'rovlari</CardTitle>
              <CardDescription>Vendorlardan kelgan pul yechish so'rovlari</CardDescription>
            </div>
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Kutilmoqda
                <Badge variant="destructive" className="ml-2">
                  {payouts.filter(p => p.status === 'pending').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="processing">Jarayonda</TabsTrigger>
              <TabsTrigger value="completed">To'langan</TabsTrigger>
              <TabsTrigger value="rejected">Rad etilgan</TabsTrigger>
              <TabsTrigger value="all">Barchasi</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Do'kon</TableHead>
                    <TableHead>Egasi</TableHead>
                    <TableHead>Summa</TableHead>
                    <TableHead>Komissiya</TableHead>
                    <TableHead>Sof summa</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono">{payout.id}</TableCell>
                      <TableCell className="font-medium">{payout.shop}</TableCell>
                      <TableCell>{payout.owner}</TableCell>
                      <TableCell>{formatPrice(payout.amount)}</TableCell>
                      <TableCell className="text-red-600">-{formatPrice(payout.commission)}</TableCell>
                      <TableCell className="font-medium text-green-600">{formatPrice(payout.netAmount)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{payout.bankName}</div>
                          <div className="text-xs text-muted-foreground">{payout.cardNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[payout.status].color}>
                          {statusConfig[payout.status].label}
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
                              ✓ To'lash
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
                        {payout.status !== 'pending' && (
                          <Button variant="outline" size="sm">
                            Ko'rish
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredPayouts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  To'lovlar topilmadi
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>To'lovni tasdiqlash</DialogTitle>
            <DialogDescription>
              {selectedPayout?.shop} ga {formatPrice(selectedPayout?.netAmount || 0)} to'lashni tasdiqlaysizmi?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank:</span>
              <span>{selectedPayout?.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Karta:</span>
              <span>{selectedPayout?.cardNumber}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>To'lanadigan summa:</span>
              <span className="text-green-600">{formatPrice(selectedPayout?.netAmount || 0)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                console.log('Approved:', selectedPayout?.id)
                setApproveDialogOpen(false)
              }}
            >
              To'lovni tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>To'lovni rad etish</DialogTitle>
            <DialogDescription>
              {selectedPayout?.shop} ning to'lov so'rovini rad etish sababini kiriting
            </DialogDescription>
          </DialogHeader>
          <Input placeholder="Sabab (masalan: Noto'g'ri karta ma'lumotlari)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                console.log('Rejected:', selectedPayout?.id)
                setRejectDialogOpen(false)
              }}
            >
              Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
