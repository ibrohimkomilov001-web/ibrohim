'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Users } from 'lucide-react'
import { getUsers, getUserStats, updateUserRole, toggleUserStatus, type User } from './actions'
import { useToast } from '@/components/ui/use-toast'

const roleLabels: Record<string, string> = {
  customer: 'Foydalanuvchi',
  vendor: 'Vendor',
  admin: 'Admin',
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({ total: 0, customers: 0, vendors: 0, admins: 0, active: 0 })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, statsData] = await Promise.all([
        getUsers(),
        getUserStats()
      ])
      setUsers(usersData)
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

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery)
  )

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleToggleStatus = async () => {
    if (!selectedUser) return

    try {
      setActionLoading(true)
      await toggleUserStatus(selectedUser.id, !selectedUser.is_active)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: selectedUser.is_active ? "Foydalanuvchi bloklandi" : "Blokdan chiqarildi" })
      setBlockDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      toast({ title: "Xatolik", description: "Statusni o'zgartirishda xatolik", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return

    try {
      setActionLoading(true)
      await updateUserRole(selectedUser.id, newRole)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Foydalanuvchi roli yangilandi" })
      setRoleDialogOpen(false)
      setSelectedUser(null)
      setNewRole('')
    } catch (error) {
      toast({ title: "Xatolik", description: "Rolni o'zgartirishda xatolik", variant: "destructive" })
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
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Foydalanuvchilar</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Platformadagi barcha foydalanuvchilar
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Jami</CardTitle>
            <span className="text-lg sm:text-2xl">👥</span>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Mijozlar</CardTitle>
            <span className="text-lg sm:text-2xl">🛒</span>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.customers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Vendorlar</CardTitle>
            <span className="text-lg sm:text-2xl">🏪</span>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.vendors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Adminlar</CardTitle>
            <span className="text-lg sm:text-2xl">👑</span>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Foydalanuvchilar ro'yxati</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Foydalanuvchilarni boshqaring</CardDescription>
            </div>
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-2 p-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Foydalanuvchilar topilmadi</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} />
                      <AvatarFallback className="text-xs">{getInitials(user.full_name || '')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{user.full_name || "Noma'lum"}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'vendor' ? 'secondary' : 'outline'} className="text-xs">
                        {roleLabels[user.role as string] || 'Foydalanuvchi'}
                      </Badge>
                      <Badge variant={user.is_active !== false ? 'default' : 'destructive'} className="text-xs">
                        {user.is_active !== false ? 'Faol' : 'Bloklangan'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => {
                      setSelectedUser(user)
                      setNewRole(user.role || 'customer')
                      setRoleDialogOpen(true)
                    }}>Rol</Button>
                    <Button variant={user.is_active !== false ? 'destructive' : 'default'} size="sm" className="flex-1 h-8 text-xs" onClick={() => {
                      setSelectedUser(user)
                      setBlockDialogOpen(true)
                    }}>{user.is_active !== false ? 'Bloklash' : 'Aktivlashtirish'}</Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ro'yxatdan o'tgan</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Foydalanuvchilar topilmadi</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} />
                          <AvatarFallback>{getInitials(user.full_name || '')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.full_name || "Noma'lum"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'vendor' ? 'secondary' : 'outline'}>
                        {roleLabels[user.role as string] || 'Foydalanuvchi'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active !== false ? 'default' : 'destructive'}>
                        {user.is_active !== false ? 'Faol' : 'Bloklangan'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{user.created_at ? new Date(user.created_at).toLocaleDateString('uz-UZ') : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setNewRole(user.role || 'customer')
                            setRoleDialogOpen(true)
                          }}
                        >
                          Rol
                        </Button>
                        <Button
                          variant={user.is_active !== false ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setBlockDialogOpen(true)
                          }}
                        >
                          {user.is_active !== false ? 'Bloklash' : 'Aktivlashtirish'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Block/Unblock Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_active !== false ? 'Foydalanuvchini bloklash' : 'Aktivlashtirish'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_active !== false
                ? `"${selectedUser?.full_name}" foydalanuvchisini bloklashni xohlaysizmi?`
                : `"${selectedUser?.full_name}" foydalanuvchisini aktivlashtirishni xohlaysizmi?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              variant={selectedUser?.is_active !== false ? 'destructive' : 'default'}
              onClick={handleToggleStatus}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedUser?.is_active !== false ? 'Bloklash' : 'Aktivlashtirish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foydalanuvchi rolini o'zgartirish</DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name} uchun yangi rol tanlang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rol tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Foydalanuvchi</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleRoleChange} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
