'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Users } from 'lucide-react'
import { getUsers, updateUserRole, toggleUserStatus, type User } from './actions'
import { toast } from 'sonner'
import { useUrlState } from '@/hooks/use-url-state'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { DataTablePagination, type PaginationMeta } from '@/components/ui/data-table-pagination'
import { useTranslation } from '@/store/locale-store'

const roleLabels: Record<string, string> = {
  customer: 'Foydalanuvchi',
  user: 'Foydalanuvchi',
  vendor: 'Sotuvchi',
  admin: 'Admin',
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [{ search: searchQuery, tab: activeTab, page }, setFilters] = useUrlState({ search: '', tab: 'all', page: '1' })
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, activeTab, page],
    queryFn: () => getUsers({
      search: debouncedSearch || undefined,
      role: activeTab !== 'all' ? activeTab : undefined,
      page: parseInt(page) || 1,
    }),
    staleTime: 15_000,
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false };

  const loadData = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });

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
      toast.success(selectedUser.is_active ? t('blocked') : t('active'))
      setBlockDialogOpen(false)
      setSelectedUser(null)
    } catch {
      toast.error(t('errorOccurred'))
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
      toast.success(t('updated'))
      setRoleDialogOpen(false)
      setSelectedUser(null)
      setNewRole('')
    } catch {
      toast.error(t('errorOccurred'))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t('users')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('totalUsers')} ({pagination.total})
        </p>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">{t('users')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t('users')}</CardDescription>
              </div>
              <Input
                placeholder={t('searchPlaceholderGeneric')}
                value={searchQuery}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full sm:w-72"
              />
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setFilters({ tab: v })}>
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">{t('all')}</TabsTrigger>
                <TabsTrigger value="user" className="text-xs sm:text-sm">{t('users')}</TabsTrigger>
                <TabsTrigger value="vendor" className="text-xs sm:text-sm">{t('toVendors')}</TabsTrigger>
                <TabsTrigger value="admin" className="text-xs sm:text-sm">Adminlar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-2 p-3">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t('noItems')}</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} />
                      <AvatarFallback className="text-xs">{getInitials(user.full_name || '')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{user.full_name || t('noData')}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'vendor' ? 'secondary' : 'outline'} className="text-xs">
                        {roleLabels[user.role as string] || 'Foydalanuvchi'}
                      </Badge>
                      <Badge variant={user.is_active !== false ? 'default' : 'destructive'} className="text-xs">
                        {user.is_active !== false ? t('active') : t('blocked')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => {
                      setSelectedUser(user)
                      setNewRole(user.role || 'customer')
                      setRoleDialogOpen(true)
                    }}>{t('role')}</Button>
                    <Button variant={user.is_active !== false ? 'destructive' : 'default'} size="sm" className="flex-1 h-8 text-xs" onClick={() => {
                      setSelectedUser(user)
                      setBlockDialogOpen(true)
                    }}>{user.is_active !== false ? t('blocked') : t('active')}</Button>
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
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('createdAt')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">{t('noItems')}</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} />
                          <AvatarFallback>{getInitials(user.full_name || '')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.full_name || t('noData')}</div>
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
                        {user.is_active !== false ? t('active') : t('blocked')}
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
                          {t('role')}
                        </Button>
                        <Button
                          variant={user.is_active !== false ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setBlockDialogOpen(true)
                          }}
                        >
                          {user.is_active !== false ? t('blocked') : t('active')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
          <div className="px-3 sm:px-0">
            <DataTablePagination
              pagination={pagination}
              onPageChange={(p) => setFilters({ page: String(p) })}
            />
          </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Block/Unblock Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_active !== false ? t('blocked') : t('active')}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_active !== false
                ? t('confirmDelete')
                : t('confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant={selectedUser?.is_active !== false ? 'destructive' : 'default'}
              onClick={handleToggleStatus}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedUser?.is_active !== false ? t('blocked') : t('active')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('role')}</DialogTitle>
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
                <SelectItem value="vendor">Sotuvchi</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleRoleChange} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
