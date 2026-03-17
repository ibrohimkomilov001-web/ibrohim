"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Settings,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  Store,
  Loader2,
  Trash2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getShops, getShopStats, updateShopStatus, updateShopCommission, deleteShop, type Shop } from "./actions";
import { toast } from 'sonner';
import { useUrlState } from '@/hooks/use-url-state';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { DataTablePagination, type PaginationMeta } from '@/components/ui/data-table-pagination';
import { useTranslation } from '@/store/locale-store';

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Faol", variant: "default" },
  pending: { label: "Kutilmoqda", variant: "secondary" },
  inactive: { label: "Nofaol", variant: "destructive" },
  blocked: { label: "Bloklangan", variant: "destructive" },
};

export default function AdminShopsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [{ search: searchQuery, tab: activeTab, page }, setFilters] = useUrlState({ search: '', tab: 'all', page: '1' });
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [newCommission, setNewCommission] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const { data: shopsResult, isLoading: shopsLoading } = useQuery({
    queryKey: ['admin-shops', debouncedSearch, activeTab, page],
    queryFn: () => getShops({
      page: parseInt(page) || 1,
      search: debouncedSearch || undefined,
      status: activeTab !== 'all' ? activeTab : undefined,
    }),
    staleTime: 15_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-shops-stats'],
    queryFn: getShopStats,
    staleTime: 30_000,
  });

  const shops = shopsResult?.shops ?? [];
  const pagination = shopsResult?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false };
  const stats = statsData ?? { total: 0, pending: 0, active: 0, blocked: 0 };
  const loading = shopsLoading;

  const loadData = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-shops'] });
    queryClient.invalidateQueries({ queryKey: ['admin-shops-stats'] });
  };

  const handleStatusChange = async (shop: Shop, newStatus: "active" | "inactive" | "blocked") => {
    try {
      setActionLoading(true);
      await updateShopStatus(shop.id, newStatus);
      await loadData();
      toast.success(t('updated'));
      setIsDetailOpen(false);
    } catch (error) {
      toast.error(t('errorOccurred'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommissionChange = async () => {
    if (!selectedShop || !newCommission) return;
    
    try {
      setActionLoading(true);
      await updateShopCommission(selectedShop.id, parseFloat(newCommission));
      await loadData();
      toast.success(t('updated'));
      setIsCommissionOpen(false);
    } catch (error) {
      toast.error(t('errorOccurred'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteShop = async () => {
    if (!selectedShop || deleteConfirmName !== selectedShop.name) return;
    
    try {
      setActionLoading(true);
      await deleteShop(selectedShop.id);
      await loadData();
      toast.success(t('deleted'));
      setIsDeleteOpen(false);
      setDeleteConfirmName("");
      setSelectedShop(null);
    } catch (error: any) {
      const msg = error?.message || t('errorOccurred');
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('shops')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('shops')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setFilters({ tab: v })} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex w-max sm:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">{t('all')} ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">{t('pending')} ({stats.pending})</TabsTrigger>
              <TabsTrigger value="active" className="text-xs sm:text-sm">{t('active')} ({stats.active})</TabsTrigger>
              <TabsTrigger value="blocked" className="text-xs sm:text-sm">{t('blocked')} ({stats.blocked})</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholderGeneric')}
                className="pl-9 w-full sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => setFilters({ search: e.target.value })}
              />
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="relative">
          {loading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {shops.length === 0 && !loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('noItems')}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {shops.map((shop) => (
                  <Card key={shop.id} className="overflow-hidden">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={shop.logo_url || ""} />
                          <AvatarFallback className="text-xs">{shop.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{shop.name}</div>
                          <div className="text-xs text-muted-foreground">{shop.owner?.full_name || t('noData')}</div>
                        </div>
                        <Badge variant={statusConfig[shop.status]?.variant || "secondary"} className="text-xs flex-shrink-0">
                          {statusConfig[shop.status]?.label || shop.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-muted/50 rounded-lg p-2 min-w-0">
                          <div className="font-semibold text-xs sm:text-sm truncate">{formatPrice(shop.balance)}</div>
                          <div className="text-xs text-muted-foreground">{t('balance')}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <div className="font-semibold text-sm">{shop.commission_rate}%</div>
                          <div className="text-xs text-muted-foreground">{t('commission')}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <div className="font-semibold text-sm">{shop.total_orders}</div>
                          <div className="text-xs text-muted-foreground">{t('orders')}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setSelectedShop(shop); setIsDetailOpen(true); }}>
                          <Eye className="mr-1 h-3 w-3" /> {t('view')}
                        </Button>
                        {shop.status === "pending" && (
                          <>
                            <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleStatusChange(shop, "active")}>
                              <CheckCircle className="mr-1 h-3 w-3" /> {t('approve')}
                            </Button>
                            <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => handleStatusChange(shop, "inactive")}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {shop.status === "active" && (
                          <Button variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleStatusChange(shop, "blocked")}>
                            <Ban className="mr-1 h-3 w-3" /> {t('blocked')}
                          </Button>
                        )}
                        {shop.status === "blocked" && (
                          <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleStatusChange(shop, "active")}>
                            <CheckCircle className="mr-1 h-3 w-3" /> {t('active')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('shop')}</TableHead>
                        <TableHead>{t('seller')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead>{t('balance')}</TableHead>
                        <TableHead>{t('commission')}</TableHead>
                        <TableHead>{t('date')}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shops.map((shop) => (
                        <TableRow key={shop.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={shop.logo_url || ""} />
                                <AvatarFallback>{shop.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{shop.name}</div>
                                <div className="text-xs text-muted-foreground">{shop.total_orders} {t('orders')}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{shop.owner?.full_name || t('noData')}</div>
                              <div className="text-xs text-muted-foreground">{shop.owner?.phone || shop.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig[shop.status]?.variant || "secondary"}>
                              {statusConfig[shop.status]?.label || shop.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatPrice(shop.balance)}</TableCell>
                          <TableCell>{shop.commission_rate}%</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(shop.created_at).toLocaleDateString("uz-UZ")}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSelectedShop(shop); setIsDetailOpen(true); }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t('view')}
                                </DropdownMenuItem>
                                {shop.status === "pending" && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleStatusChange(shop, "active")}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      {t('approve')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(shop, "inactive")} className="text-destructive">
                                      <XCircle className="mr-2 h-4 w-4" />
                                      {t('reject')}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {shop.status === "active" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(shop, "blocked")} className="text-destructive">
                                    <Ban className="mr-2 h-4 w-4" />
                                    {t('blocked')}
                                  </DropdownMenuItem>
                                )}
                                {shop.status === "blocked" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(shop, "active")}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {t('active')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSelectedShop(shop); setNewCommission(shop.commission_rate.toString()); setIsCommissionOpen(true); }}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  {t('commission')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSelectedShop(shop); setDeleteConfirmName(""); setIsDeleteOpen(true); }} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </>
          )}
          <DataTablePagination pagination={pagination} onPageChange={(p) => setFilters({ page: String(p) })} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Shop Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('shopDetails')}</DialogTitle>
          </DialogHeader>
          {selectedShop && (
            <div className="space-y-6">
              {/* Shop Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedShop.logo_url || ""} />
                  <AvatarFallback className="text-lg">
                    {selectedShop.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{selectedShop.name}</h3>
                    <Badge variant={statusConfig[selectedShop.status]?.variant || "secondary"}>
                      {statusConfig[selectedShop.status]?.label || selectedShop.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">@{selectedShop.slug}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <DollarSign className="h-5 w-5 text-muted-foreground mb-1" />
                    <div className="text-lg font-semibold">{formatPrice(selectedShop.balance)}</div>
                    <div className="text-xs text-muted-foreground">{t('balance')}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground mb-1" />
                    <div className="text-lg font-semibold">{selectedShop.total_orders}</div>
                    <div className="text-xs text-muted-foreground">{t('orders')}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <Store className="h-5 w-5 text-muted-foreground mb-1" />
                    <div className="text-lg font-semibold">{selectedShop.total_products}</div>
                    <div className="text-xs text-muted-foreground">{t('products')}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <Settings className="h-5 w-5 text-muted-foreground mb-1" />
                    <div className="text-lg font-semibold">{selectedShop.commission_rate}%</div>
                    <div className="text-xs text-muted-foreground">{t('commission')}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Owner Info */}
              <div className="space-y-2">
                <h4 className="font-medium">{t('shopDetails')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t('name')}:</span>
                    <span>{selectedShop.owner?.full_name || t('noData')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedShop.owner?.phone || selectedShop.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{(selectedShop.owner as any)?.email || selectedShop.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedShop.address || selectedShop.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Ro'yxatdan o'tgan: {new Date(selectedShop.created_at).toLocaleDateString("uz-UZ")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedShop?.status === "pending" && (
              <>
                <Button variant="destructive" onClick={() => handleStatusChange(selectedShop, "inactive")} disabled={actionLoading}>
                  <XCircle className="mr-2 h-4 w-4" />
                  {t('reject')}
                </Button>
                <Button onClick={() => handleStatusChange(selectedShop, "active")} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t('approve')}
                </Button>
              </>
            )}
            {selectedShop?.status === "active" && (
              <Button variant="destructive" onClick={() => handleStatusChange(selectedShop, "blocked")} disabled={actionLoading}>
                <Ban className="mr-2 h-4 w-4" />
                {t('blocked')}
              </Button>
            )}
            {selectedShop?.status === "blocked" && (
              <Button onClick={() => handleStatusChange(selectedShop, "active")} disabled={actionLoading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('active')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Dialog */}
      <Dialog open={isCommissionOpen} onOpenChange={setIsCommissionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('commission')}</DialogTitle>
            <DialogDescription>
              {selectedShop?.name} uchun yangi komissiya foizini kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('commission')} (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newCommission}
                onChange={(e) => setNewCommission(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommissionOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCommissionChange} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (!open) setDeleteConfirmName(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">{t('delete')}</DialogTitle>
            <DialogDescription>
              {t('confirmDeleteDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-destructive/10 rounded-md">
              <p className="text-sm font-semibold">{selectedShop?.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('seller')}: {selectedShop?.owner?.full_name || t('noData')} | {selectedShop?.owner?.phone || ""}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('shopName')}</Label>
              <Input
                placeholder={selectedShop?.name}
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteShop} 
              disabled={actionLoading || deleteConfirmName !== selectedShop?.name}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
