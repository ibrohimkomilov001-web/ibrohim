"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminRoles, updateAdminRole, deleteAdminRole, fetchUsers } from "@/lib/api/admin";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  Shield, MoreHorizontal, Pencil, Trash2, Loader2, Search, UserPlus,
} from "lucide-react";

const PERMISSION_LEVELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "destructive" },
  admin: { label: "Admin", color: "default" },
  moderator: { label: "Moderator", color: "secondary" },
  support: { label: "Support", color: "outline" },
};

const ALL_PERMISSIONS = [
  "users.manage", "shops.manage", "products.manage", "orders.manage",
  "payouts.manage", "categories.manage", "banners.manage",
  "promotions.manage", "penalties.manage", "moderation.manage",
  "roles.manage", "settings.manage", "analytics.view", "logs.view",
];

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    userId: "",
    level: "moderator",
    permissions: [] as string[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: fetchAdminRoles,
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-users-for-role"],
    queryFn: () => fetchUsers({ page: 1, search: "" }),
    enabled: addOpen,
  });

  const updateMut = useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: any }) => updateAdminRole(userId, body),
    onSuccess: () => {
      toast.success("Rol yangilandi");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      setEditOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAdminRole,
    onSuccess: () => {
      toast.success("Rol o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const roles = (data as any)?.roles || data || [];
  const users = (usersData as any)?.users || [];

  const filteredRoles = roles.filter((r: any) => {
    if (!search) return true;
    const name = r.user?.name || r.user?.phone || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const openEdit = (role: any) => {
    setSelected(role);
    setForm({
      userId: role.userId,
      level: role.level,
      permissions: role.permissions || [],
    });
    setEditOpen(true);
  };

  const openAdd = () => {
    setForm({ userId: "", level: "moderator", permissions: [] });
    setAddOpen(true);
  };

  const togglePermission = (perm: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const handleSave = () => {
    const userId = editOpen ? selected?.userId : form.userId;
    if (!userId) return;
    updateMut.mutate({
      userId,
      body: { level: form.level, permissions: form.permissions },
    });
    if (addOpen) setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> Admin rollar
          </h1>
          <p className="text-muted-foreground">Administrator huquqlarini boshqarish</p>
        </div>
        <Button onClick={openAdd}>
          <UserPlus className="mr-2 h-4 w-4" /> Rol qo&apos;shish
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Daraja</TableHead>
                <TableHead>Ruxsatlar</TableHead>
                <TableHead>Yaratilgan</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Rollar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role: any) => {
                  const cfg = PERMISSION_LEVELS[role.level] || PERMISSION_LEVELS.support;
                  return (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{role.user?.name || "—"}</div>
                          <div className="text-sm text-muted-foreground">{role.user?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.color as any}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(role.permissions || []).slice(0, 3).map((p: string) => (
                            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                          {role.permissions?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(role.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(role)}>
                              <Pencil className="h-4 w-4 mr-2" /> Tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteMut.mutate(role.userId)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> O&apos;chirish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rolni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Daraja</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PERMISSION_LEVELS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Ruxsatlar</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="rounded border-muted-foreground/50"
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Bekor</Button>
            <Button onClick={handleSave} disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yangi rol qo&apos;shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Foydalanuvchi</Label>
              <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v })}>
                <SelectTrigger><SelectValue placeholder="Foydalanuvchi tanlang" /></SelectTrigger>
                <SelectContent>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.phone} — {u.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Daraja</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PERMISSION_LEVELS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Ruxsatlar</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="rounded border-muted-foreground/50"
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Bekor</Button>
            <Button onClick={handleSave} disabled={updateMut.isPending || !form.userId}>
              {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
