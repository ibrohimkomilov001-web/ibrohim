"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";

import { courierCompanyApi } from "@/lib/api/courier-company";
import type { CourierCompanyMembership } from "@/lib/api/courier-company";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Loader2,
  UserPlus,
  Trash2,
  Truck,
  Users,
  Building2,
  Star,
  Link2Off,
  Plus,
} from "lucide-react";
import { Can, PERM } from "@/lib/authz";

const registerSchema = z.object({
  name: z.string().min(2, "Kompaniya nomi 2 belgidan kam bo'lmasin"),
  legalName: z.string().optional(),
  inn: z.string().optional(),
});
type RegisterForm = z.infer<typeof registerSchema>;

const inviteSchema = z.object({
  email: z.string().email(),
  roleCode: z.string().min(1),
  expiresInDays: z.coerce.number().int().min(1).max(90).default(7),
});
type InviteForm = z.infer<typeof inviteSchema>;

const attachSchema = z.object({
  courierId: z.string().uuid("Kuryer ID UUID formatida bo'lishi kerak"),
});
type AttachForm = z.infer<typeof attachSchema>;

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function StatusBadge({ status }: { status: CourierCompanyMembership["status"] }) {
  const map = {
    active: { label: "Faol", variant: "default" as const },
    pending: { label: "Kutilmoqda", variant: "secondary" as const },
    suspended: { label: "To'xtatilgan", variant: "outline" as const },
    revoked: { label: "Chiqarilgan", variant: "destructive" as const },
  };
  const v = map[status];
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

// ============================================
// Registration form (when user has no company)
// ============================================

function RegisterCompany() {
  const qc = useQueryClient();
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", legalName: "", inn: "" },
  });

  const createCompany = useMutation({
    mutationFn: courierCompanyApi.create,
    onSuccess: () => {
      toast.success("Kompaniya yaratildi!");
      qc.invalidateQueries({ queryKey: ["courier-company"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message || e.message || "Xatolik");
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Kuryerlik kompaniyasini yaratish
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((v) => createCompany.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Kompaniya nomi *</Label>
              <Input id="name" {...form.register("name")} placeholder="Tez Yetkazish MChJ" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalName">Rasmiy nomi</Label>
              <Input id="legalName" {...form.register("legalName")} placeholder="MChJ Tez Yetkazish" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inn">STIR / INN</Label>
              <Input id="inn" {...form.register("inn")} placeholder="123456789" />
            </div>

            <Button type="submit" className="w-full" disabled={createCompany.isPending}>
              {createCompany.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kompaniya yaratish
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Staff tab
// ============================================

function StaffTab() {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["courier-company-staff"],
    queryFn: courierCompanyApi.listStaff,
  });
  const { data: invites } = useQuery({
    queryKey: ["courier-company-invites"],
    queryFn: courierCompanyApi.listInvites,
  });
  const { data: roles } = useQuery({
    queryKey: ["courier-company-roles"],
    queryFn: courierCompanyApi.listRoles,
  });

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", roleCode: "", expiresInDays: 7 },
  });

  const createInvite = useMutation({
    mutationFn: courierCompanyApi.createInvite,
    onSuccess: (data) => {
      toast.success(`${data.email} ga taklif yuborildi`);
      if (data.inviteUrl) setLastInviteLink(data.inviteUrl);
      form.reset();
      setInviteOpen(false);
      qc.invalidateQueries({ queryKey: ["courier-company-invites"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Xatolik"),
  });

  const cancelInvite = useMutation({
    mutationFn: courierCompanyApi.cancelInvite,
    onSuccess: () => {
      toast.success("Taklif bekor qilindi");
      qc.invalidateQueries({ queryKey: ["courier-company-invites"] });
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, roleCode }: { id: string; roleCode: string }) =>
      courierCompanyApi.updateStaff(id, { roleCode }),
    onSuccess: () => {
      toast.success("Rol yangilandi");
      qc.invalidateQueries({ queryKey: ["courier-company-staff"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Xatolik"),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" }) =>
      courierCompanyApi.updateStaff(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courier-company-staff"] }),
  });

  const removeStaff = useMutation({
    mutationFn: courierCompanyApi.removeStaff,
    onSuccess: () => {
      toast.success("Xodim chiqarildi");
      qc.invalidateQueries({ queryKey: ["courier-company-staff"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Xatolik"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Xodimlar</h2>
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
              <DialogTitle>Yangi xodim taklifi</DialogTitle>
              <DialogDescription>
                Foydalanuvchi tizimda ro'yxatdan o'tgan bo'lishi kerak.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit((v) => createInvite.mutate(v))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...form.register("email")} placeholder="xodim@example.com" />
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
                <Label>Muddat (kun)</Label>
                <Input type="number" min={1} max={90} {...form.register("expiresInDays")} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                  Bekor
                </Button>
                <Button type="submit" disabled={createInvite.isPending}>
                  {createInvite.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Yuborish
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </Can>
      </div>

      {lastInviteLink && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-4 text-sm break-all">
            <span className="font-medium">Dev link: </span>
            {lastInviteLink}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !staff || staff.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Xodim yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Status</TableHead>
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
                              <AlertDialogTitle>Xodimni chiqarasizmi?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {m.profile.fullName || m.profile.email} kompaniyadan chiqariladi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Bekor</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground"
                                onClick={() => removeStaff.mutate(m.id)}
                              >
                                Chiqarish
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

      {invites && invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kutilayotgan takliflar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Yuborilgan</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.invitedEmail || i.profile?.email || "—"}</TableCell>
                    <TableCell>{i.role.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(i.invitedAt), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => cancelInvite.mutate(i.id)}
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

// ============================================
// Fleet tab
// ============================================

function FleetTab() {
  const qc = useQueryClient();
  const [attachOpen, setAttachOpen] = useState(false);

  const { data: couriers, isLoading } = useQuery({
    queryKey: ["courier-company-fleet"],
    queryFn: courierCompanyApi.listFleet,
  });

  const form = useForm<AttachForm>({
    resolver: zodResolver(attachSchema),
    defaultValues: { courierId: "" },
  });

  const attach = useMutation({
    mutationFn: (data: AttachForm) => courierCompanyApi.attachCourier(data.courierId),
    onSuccess: () => {
      toast.success("Kuryer ulandi");
      form.reset();
      setAttachOpen(false);
      qc.invalidateQueries({ queryKey: ["courier-company-fleet"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || "Xatolik"),
  });

  const detach = useMutation({
    mutationFn: courierCompanyApi.detachCourier,
    onSuccess: () => {
      toast.success("Kuryer chiqarildi");
      qc.invalidateQueries({ queryKey: ["courier-company-fleet"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kuryerlar parki</h2>
        <Can permission={PERM.COURIERS_MANAGE}>
        <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Kuryer ulash
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kuryerni kompaniyaga ulash</DialogTitle>
              <DialogDescription>
                Kuryer ilovada ro'yxatdan o'tgan bo'lishi kerak. Kuryer ID'sini kiriting.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((v) => attach.mutate(v))} className="space-y-4">
              <div className="space-y-2">
                <Label>Kuryer ID (UUID)</Label>
                <Input {...form.register("courierId")} placeholder="00000000-0000-..." />
                {form.formState.errors.courierId && (
                  <p className="text-xs text-destructive">{form.formState.errors.courierId.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAttachOpen(false)}>
                  Bekor
                </Button>
                <Button type="submit" disabled={attach.isPending}>
                  {attach.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Ulash
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </Can>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !couriers || couriers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Kuryer yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kuryer</TableHead>
                  <TableHead>Transport</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reyting</TableHead>
                  <TableHead>Yetkazish</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couriers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {c.profile.avatarUrl && <AvatarImage src={c.profile.avatarUrl} />}
                          <AvatarFallback>{initials(c.profile.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{c.profile.fullName || "—"}</p>
                          <p className="text-xs text-muted-foreground">{c.profile.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>{c.vehicleType}</span>
                        {c.vehicleNumber && (
                          <Badge variant="outline" className="text-xs">{c.vehicleNumber}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "online" ? "default" : c.status === "busy" ? "secondary" : "outline"}
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {c.rating.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.totalDeliveries}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Link2Off className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Kuryerni chiqarasizmi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {c.profile.fullName || "Kuryer"} kompaniyadan ajratiladi, lekin kuryer profili saqlanib qoladi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Bekor</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={() => detach.mutate(c.id)}
                            >
                              Chiqarish
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Overview tab
// ============================================

function OverviewTab({ data }: { data: NonNullable<Awaited<ReturnType<typeof courierCompanyApi.getOverview>>> }) {
  const activeStaff = data.memberships.filter((m) => m.status === "active").length;
  const onlineCouriers = data.couriers.filter((c) => c.status === "online").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {data.organization.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.organization.legalName && (
            <p>
              <span className="text-muted-foreground">Rasmiy nomi:</span> {data.organization.legalName}
            </p>
          )}
          {data.organization.inn && (
            <p>
              <span className="text-muted-foreground">STIR:</span> {data.organization.inn}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Status:</span>{" "}
            <Badge variant="outline">{data.organization.status}</Badge>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{activeStaff}</p>
                <p className="text-xs text-muted-foreground">Faol xodimlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{data.couriers.length}</p>
                <p className="text-xs text-muted-foreground">Jami kuryerlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{onlineCouriers}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// Main page
// ============================================

export default function CourierCompanyPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["courier-company"],
    queryFn: courierCompanyApi.getOverview,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 404 — kompaniyasi yo'q, ro'yxatdan o'tkazish
  if (error || !data) {
    return <RegisterCompany />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kuryerlik kompaniyasi</h1>
        <p className="text-sm text-muted-foreground mt-1">{data.organization.name}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          <TabsTrigger value="staff">Xodimlar</TabsTrigger>
          <TabsTrigger value="fleet">Kuryerlar parki</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <OverviewTab data={data} />
        </TabsContent>
        <TabsContent value="staff" className="mt-6">
          <StaffTab />
        </TabsContent>
        <TabsContent value="fleet" className="mt-6">
          <FleetTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
