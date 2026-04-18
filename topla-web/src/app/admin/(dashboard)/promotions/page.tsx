"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPromotions, createPromotion, updatePromotionStatus, deletePromotion,
} from "@/lib/api/admin";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  Plus, Zap, Tag, Truck, Package, Gift, Trash2, Play, Pause,
  StopCircle, Loader2, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from '@/store/locale-store';

const TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  flash_sale: { label: "flashSale", icon: Zap, color: "bg-red-500" },
  category_discount: { label: "categoryDiscount", icon: Tag, color: "bg-blue-500" },
  shop_discount: { label: "shopDiscount", icon: Package, color: "bg-blue-500" },
  free_delivery: { label: "freeDelivery", icon: Truck, color: "bg-green-500" },
  bundle_deal: { label: "bundleDeal", icon: Gift, color: "bg-orange-500" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  active: "default",
  scheduled: "outline",
  ended: "secondary",
  cancelled: "destructive",
};

export default function PromotionsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    nameUz: "", nameRu: "", descriptionUz: "", descriptionRu: "",
    type: "flash_sale", discountPercent: 10, startDate: "", endDate: "",
    maxUsage: undefined as number | undefined,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promotions", statusFilter, typeFilter, page],
    queryFn: () => fetchPromotions({
      status: statusFilter !== "all" ? statusFilter : undefined,
      type: typeFilter !== "all" ? typeFilter : undefined,
      page,
    }),
  });

  const createMut = useMutation({
    mutationFn: createPromotion,
    onSuccess: () => {
      toast.success(t('promotionCreated'));
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      setCreateOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePromotionStatus(id, status),
    onSuccess: () => {
      toast.success(t('statusUpdated'));
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => {
      toast.success(t('promotionDeleted'));
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const promotions = data?.promotions || [];
  const meta = data?.meta;

  const handleCreate = () => {
    if (!form.nameUz || !form.startDate || !form.endDate) {
      toast.error(t('fillAllFields'));
      return;
    }
    createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('promotionsTitle')}</h1>
          <p className="text-muted-foreground">{t('promotionsDesc')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('newPromotion')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="draft">{t('draft')}</SelectItem>
            <SelectItem value="active">{t('active')}</SelectItem>
            <SelectItem value="scheduled">{t('scheduled')}</SelectItem>
            <SelectItem value="ended">{t('ended')}</SelectItem>
            <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTypes')}</SelectItem>
            {Object.entries(TYPE_LABELS).map(([key, val]) => (
              <SelectItem key={key} value={key}>{t(val.label)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : promotions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('discount')}</TableHead>
                  <TableHead>{t('period')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('usedCount')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo: any) => {
                  const typeInfo = TYPE_LABELS[promo.type] || { label: promo.type, icon: Tag };
                  const TypeIcon = typeInfo.icon;
                  return (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{promo.nameUz}</p>
                          <p className="text-xs text-muted-foreground">{promo.nameRu}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {t(typeInfo.label)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {promo.discountPercent ? `${promo.discountPercent}%` : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>{formatDate(promo.startDate)}</p>
                          <p className="text-muted-foreground">→ {formatDate(promo.endDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[promo.status] as any}>
                          {promo.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{promo.usageCount || 0}{promo.maxUsage ? ` / ${promo.maxUsage}` : ""}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {promo.status === "draft" && (
                              <DropdownMenuItem onClick={() => statusMut.mutate({ id: promo.id, status: "active" })}>
                                <Play className="mr-2 h-4 w-4" /> {t('activate')}
                              </DropdownMenuItem>
                            )}
                            {promo.status === "active" && (
                              <DropdownMenuItem onClick={() => statusMut.mutate({ id: promo.id, status: "ended" })}>
                                <StopCircle className="mr-2 h-4 w-4" /> {t('finish')}
                              </DropdownMenuItem>
                            )}
                            {promo.status !== "cancelled" && (
                              <DropdownMenuItem onClick={() => statusMut.mutate({ id: promo.id, status: "cancelled" })}>
                                <Pause className="mr-2 h-4 w-4" /> {t('cancel')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteMut.mutate(promo.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-semibold">{t('noPromotionsYet')}</p>
              <p className="text-sm">{t('createPromotionHint')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t('previous')}
          </Button>
          <span className="text-sm py-2 px-4">{page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
            {t('next')}
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('newPromotion')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('nameUz')}</Label>
                <Input value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} />
              </div>
              <div>
                <Label>{t('nameRu')}</Label>
                <Input value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{t('type')}</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{t(val.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('discountPercent')}</Label>
                <Input
                  type="number"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                  min={0} max={100}
                />
              </div>
              <div>
                <Label>{t('maxUsage')}</Label>
                <Input
                  type="number"
                  value={form.maxUsage || ""}
                  onChange={(e) => setForm({ ...form, maxUsage: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder={t('unlimited')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('startDateTime')}</Label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('endDateTime')}</Label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>{t('descriptionUz')}</Label>
              <Textarea
                value={form.descriptionUz}
                onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
