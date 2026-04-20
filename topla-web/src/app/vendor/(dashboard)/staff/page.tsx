"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";

import { vendorStaffApi } from "@/lib/api/vendor-staff";
import type { StaffMembership } from "@/lib/api/vendor-staff";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserPlus, Trash2, Mail, Copy, Check } from "lucide-react";
import { Can, PERM } from "@/lib/authz";

const inviteSchema = z.object({
  email: z.string().email("Email noto'g'ri"),
  roleCode: z.string().min(1, "Rolni tanlang"),
  expiresInDays: z.coerce.number().int().min(1).max(90).default(7),
});

type InviteFormData = z.infer<typeof inviteSchema>;

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }: { status: StaffMembership["status"] }) {
  const map = {
    active: { label: "Faol", variant: "default" as const },
    pending: { label: "Kutilmoqda", variant: "secondary" as const },
    suspended: { label: "Vaqtincha to'xtatilgan", variant: "outline" as const },
    revoked: { label: "Chiqarib yuborilgan", variant: "destructive" as const },
  };
  const v = map[status];
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

export default function VendorStaffPage() {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ["vendor-staff"],
    queryFn: vendorStaffApi.listStaff,
  });

  const { data: invites } = useQuery({
    queryKey: ["vendor-staff-invites"],
    queryFn: vendorStaffApi.listInvites,
  });

  const { data: roles } = useQuery({
    queryKey: ["vendor-staff-roles"],
    queryFn: vendorStaffApi.listRoles,
  });

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", roleCode: "", expiresInDays: 7 },
  });

  const createInvite = useMutation({
    mutationFn: vendorStaffApi.createInvite,
    onSuccess: (data) => {
      toast.success(`${data.email} ga taklif yuborildi`);
      if (data.inviteUrl) setLastInviteLink(data.inviteUrl);
      form.reset();
      setInviteOpen(false);
      qc.invalidateQueries({ queryKey: ["vendor-staff-invites"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message || e.message || "Xatolik");
    },
  });

  const cancelInvite = useMutation({
    mutationFn: vendorStaffApi.cancelInvite,
    onSuccess: () => {
      toast.success("Taklif bekor qilindi");
      qc.invalidateQueries({ queryKey: ["vendor-staff-invites"] });
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, roleCode }: { id: string; roleCode: string }) =>
      vendorStaffApi.updateStaff(id, { roleCode }),
    onSuccess: () => {
      toast.success("Rol yangilandi");
      qc.invalidateQueries({ queryKey: ["vendor-staff"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message || "Xatolik");
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" }) =>
      vendorStaffApi.updateStaff(id, { status }),
    onSuccess: () => {
      toast.success("Status yangilandi");
      qc.invalidateQueries({ queryKey: ["vendor-staff"] });
    },
  });

  const removeStaff = useMutation({
    mutationFn: vendorStaffApi.removeStaff,
    onSuccess: () => {
      toast.success("Xodim chiqarib yuborildi");
      qc.invalidateQueries({ queryKey: ["vendor-staff"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message || "Xatolik");
    },
  });

  const handleCopy = async () => {
    if (!lastInviteLink) return;
    await navigator.clipboard.writeText(lastInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xodimlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Do'koningizga xodim taklif qiling va rollarini boshqaring
          </p>
        </div>

        <Can permission={PERM.USERS_ASSIGN_ROLE}>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Xodim taklif qilish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi xodim taklif qilish</DialogTitle>
              <DialogDescription>
                Taklifingiz xodimning email manziliga yuboriladi. Foydalanuvchi tizimda ro'yxatdan o'tgan bo'lishi kerak.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit((values) => createInvite.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} placeholder="xodim@example.com" />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={form.watch("roleCode")}
                  onValueChange={(v) => form.setValue("roleCode", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rolni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((r) => (
                      <SelectItem key={r.id} value={r.code}>
                        <div className="flex flex-col">
                          <span className="font-medium">{r.name}</span>
                          {r.description && (
                            <span className="text-xs text-muted-foreground">{r.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.roleCode && (
                  <p className="text-xs text-destructive">{form.formState.errors.roleCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Amal qilish muddati (kun)</Label>
                <Input id="expires" type="number" min={1} max={90} {...form.register("expiresInDays")} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={createInvite.isPending}>
                  {createInvite.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Taklif yuborish
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </Can>
      </div>

      {/* Development-only: oxirgi invite link */}
      {lastInviteLink && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <Mail className="h-5 w-5 text-amber-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Taklif havolasi (dev rejimi)</p>
              <p className="text-xs text-muted-foreground truncate">{lastInviteLink}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active & pending staff */}
      <Card>
        <CardHeader>
          <CardTitle>Xodimlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {staffLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !staff || staff.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Hozircha xodim yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Qo'shilgan</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {m.profile.avatarUrl && <AvatarImage src={m.profile.avatarUrl} />}
                          <AvatarFallback>{initials(m.profile.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{m.profile.fullName || "—"}</p>
                          <p className="text-xs text-muted-foreground">{m.profile.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={m.role.code}
                        onValueChange={(v) => updateRole.mutate({ id: m.id, roleCode: v })}
                        disabled={updateRole.isPending}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles?.map((r) => (
                            <SelectItem key={r.id} value={r.code}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.acceptedAt ? format(new Date(m.acceptedAt), "dd.MM.yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {m.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus.mutate({ id: m.id, status: "suspended" })}
                          >
                            To'xtatish
                          </Button>
                        )}
                        {m.status === "suspended" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus.mutate({ id: m.id, status: "active" })}
                          >
                            Faollashtirish
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xodimni chiqarib yuborasizmi?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {m.profile.fullName || m.profile.email} do'koningizdan chiqarib yuboriladi. Bu amalni qaytarib bo'lmaydi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => removeStaff.mutate(m.id)}
                              >
                                Chiqarib yuborish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {invites && invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kutilayotgan takliflar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Yuborilgan</TableHead>
                  <TableHead>Muddati</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invitedEmail || inv.profile?.email || "—"}</TableCell>
                    <TableCell>{inv.role.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(inv.invitedAt), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.expiresAt ? format(new Date(inv.expiresAt), "dd.MM.yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => cancelInvite.mutate(inv.id)}
                        disabled={cancelInvite.isPending}
                      >
                        Bekor qilish
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
