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

const TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  flash_sale: { label: "Flash Sale", icon: Zap, color: "bg-red-500" },
  category_discount: { label: "Kategoriya chegirma", icon: Tag, color: "bg-blue-500" },
  shop_discount: { label: "Do'kon chegirma", icon: Package, color: "bg-purple-500" },
  free_delivery: { label: "Bepul yetkazish", icon: Truck, color: "bg-green-500" },
  bundle_deal: { label: "To'plam aksiya", icon: Gift, color: "bg-orange-500" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  active: "default",
  scheduled: "outline",
  ended: "secondary",
  cancelled: "destructive",
};

export default function PromotionsPage() {
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
      toast.success("Aksiya yaratildi");
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      setCreateOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePromotionStatus(id, status),
    onSuccess: () => {
      toast.success("Holat yangilandi");
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => {
      toast.success("Aksiya o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const promotions = data?.promotions || [];
  const meta = data?.meta;

  const handleCreate = () => {
    if (!form.nameUz || !form.startDate || !form.endDate) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aksiyalar va chegirmalar</h1>
          <p className="text-muted-foreground">Flash sale, kampaniyalar va chegirmalar</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Yangi aksiya
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="draft">Qoralama</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="scheduled">Rejalashtirilgan</SelectItem>
            <SelectItem value="ended">Tugagan</SelectItem>
            <SelectItem value="cancelled">Bekor</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha turlar</SelectItem>
            {Object.entries(TYPE_LABELS).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
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
                  <TableHead>Nomi</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Chegirma</TableHead>
                  <TableHead>Davr</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Ishlatildi</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
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
                          {typeInfo.label}
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
                                <Play className="mr-2 h-4 w-4" /> Faollashtirish
                              </DropdownMenuItem>
                            )}
                            {promo.status === "active" && (
                              <DropdownMenuItem onClick={() => statusMut.mutate({ id: promo.id, status: "ended" })}>
                                <StopCircle className="mr-2 h-4 w-4" /> Tugatish
                              </DropdownMenuItem>
                            )}
                            {promo.status !== "cancelled" && (
                              <DropdownMenuItem onClick={() => statusMut.mutate({ id: promo.id, status: "cancelled" })}>
                                <Pause className="mr-2 h-4 w-4" /> Bekor qilish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteMut.mutate(promo.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> O&apos;chirish
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
              <p className="text-lg font-semibold">Aksiyalar yo&apos;q</p>
              <p className="text-sm">Yangi aksiya yaratish uchun tugmani bosing</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Oldingi
          </Button>
          <span className="text-sm py-2 px-4">{page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
            Keyingi
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yangi aksiya</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomi (UZ)</Label>
                <Input value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} />
              </div>
              <div>
                <Label>Nomi (RU)</Label>
                <Input value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Turi</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chegirma %</Label>
                <Input
                  type="number"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                  min={0} max={100}
                />
              </div>
              <div>
                <Label>Max foydalanish</Label>
                <Input
                  type="number"
                  value={form.maxUsage || ""}
                  onChange={(e) => setForm({ ...form, maxUsage: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Cheksiz"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Boshlanishi</Label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Tugashi</Label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Tavsif (UZ)</Label>
              <Textarea
                value={form.descriptionUz}
                onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
