"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  MapPin,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Edit,
  Phone,
  Clock,
  Package,
  Search,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getPickupPoints,
  getPickupPointStats,
  createPickupPoint,
  togglePickupPointStatus,
  editPickupPoint,
  removePickupPoint,
  type PickupPoint,
} from "./actions";

export default function AdminPickupPointsPage() {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPinCode, setShowPinCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    phone: "",
    loginCode: "",
    pinCode: "",
    workingHoursWeekday: "09:00 - 18:00",
    workingHoursWeekend: "10:00 - 16:00",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pointsData, statsData] = await Promise.all([
        getPickupPoints(),
        getPickupPointStats(),
      ]);
      setPoints(pointsData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      setError("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const filteredPoints = points.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.loginCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      phone: "",
      loginCode: "",
      pinCode: "",
      workingHoursWeekday: "09:00 - 18:00",
      workingHoursWeekend: "10:00 - 16:00",
    });
    setShowPinCode(false);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.address || !formData.loginCode || !formData.pinCode) {
      setError("Nom, manzil, login kod va PIN kod majburiy");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const workingHours: Record<string, string> = {};
      if (formData.workingHoursWeekday) {
        ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach(
          (d) => (workingHours[d] = formData.workingHoursWeekday)
        );
      }
      if (formData.workingHoursWeekend) {
        ["saturday", "sunday"].forEach(
          (d) => (workingHours[d] = formData.workingHoursWeekend)
        );
      }

      await createPickupPoint({
        name: formData.name,
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        phone: formData.phone || undefined,
        workingHours: Object.keys(workingHours).length ? workingHours : undefined,
        loginCode: formData.loginCode,
        pinCode: formData.pinCode,
      });
      await loadData();
      setSuccess("Topshirish punkti yaratildi");
      setCreateDialogOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Yaratishda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedPoint || !formData.name || !formData.address) {
      setError("Nom va manzil majburiy");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const workingHours: Record<string, string> = {};
      if (formData.workingHoursWeekday) {
        ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach(
          (d) => (workingHours[d] = formData.workingHoursWeekday)
        );
      }
      if (formData.workingHoursWeekend) {
        ["saturday", "sunday"].forEach(
          (d) => (workingHours[d] = formData.workingHoursWeekend)
        );
      }

      const updateData: any = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone || null,
        workingHours: Object.keys(workingHours).length ? workingHours : undefined,
      };

      if (formData.latitude) updateData.latitude = parseFloat(formData.latitude);
      if (formData.longitude) updateData.longitude = parseFloat(formData.longitude);
      if (formData.pinCode) updateData.pinCode = formData.pinCode;

      await editPickupPoint(selectedPoint.id, updateData);
      await loadData();
      setSuccess("Topshirish punkti yangilandi");
      setEditDialogOpen(false);
      resetForm();
      setSelectedPoint(null);
    } catch (err: any) {
      setError(err.message || "Yangilashda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (point: PickupPoint) => {
    try {
      await togglePickupPointStatus(point.id, !point.isActive);
      await loadData();
      setSuccess(`Punkt ${!point.isActive ? "faollashtirildi" : "o'chirildi"}`);
    } catch (err: any) {
      setError(err.message || "Statusni o'zgartirishda xatolik");
    }
  };

  const handleDelete = async () => {
    if (!selectedPoint) return;
    try {
      setActionLoading(true);
      setError(null);
      await removePickupPoint(selectedPoint.id);
      await loadData();
      setSuccess("Topshirish punkti o'chirildi");
      setDeleteDialogOpen(false);
      setSelectedPoint(null);
    } catch (err: any) {
      setError(err.message || "O'chirishda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (point: PickupPoint) => {
    setSelectedPoint(point);
    const wh = point.workingHours as Record<string, string> | null;
    setFormData({
      name: point.name,
      address: point.address,
      latitude: point.latitude?.toString() || "",
      longitude: point.longitude?.toString() || "",
      phone: point.phone || "",
      loginCode: point.loginCode,
      pinCode: "",
      workingHoursWeekday: wh?.monday || "09:00 - 18:00",
      workingHoursWeekend: wh?.saturday || "10:00 - 16:00",
    });
    setEditDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Nusxalandi!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Topshirish punktlari</h1>
          <p className="text-muted-foreground">
            Mijozlar buyurtmalarini olib ketadigan punktlar
          </p>
        </div>
        <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Yangi punkt
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Jami punktlar</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Faol</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <div className="text-sm text-muted-foreground">Nofaol</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Nom, manzil yoki login kod bo'yicha qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Points List */}
      <div className="space-y-4">
        {filteredPoints.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Topshirish punktlari topilmadi</p>
            </CardContent>
          </Card>
        ) : (
          filteredPoints.map((point) => (
            <Card key={point.id} className={!point.isActive ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{point.name}</span>
                      <Badge variant={point.isActive ? "default" : "secondary"}>
                        {point.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                      {point._count?.orders !== undefined && (
                        <Badge variant="outline" className="gap-1">
                          <Package className="h-3 w-3" />
                          {point._count.orders} buyurtma
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {point.address}
                      </span>
                      {point.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {point.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        Login kod:
                        <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{point.loginCode}</code>
                        <button onClick={() => copyToClipboard(point.loginCode)} className="hover:text-primary">
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                      {point.workingHours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {(point.workingHours as any)?.monday || "—"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(point)}
                      title={point.isActive ? "O'chirish" : "Yoqish"}
                    >
                      {point.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(point)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setSelectedPoint(point); setDeleteDialogOpen(true); }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yangi topshirish punkti</DialogTitle>
            <DialogDescription>
              Buyurtmalarni topshirish uchun yangi punkt yarating
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nomi *</Label>
                <Input
                  placeholder="Chilonzor punkt"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Manzil *</Label>
                <Input
                  placeholder="Chilonzor tumani, Bunyodkor ko'chasi, 12"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  placeholder="+998901234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Login kodi *</Label>
                <Input
                  placeholder="PKT-001"
                  value={formData.loginCode}
                  onChange={(e) => setFormData({ ...formData, loginCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>PIN kod *</Label>
                <div className="relative">
                  <Input
                    type={showPinCode ? "text" : "password"}
                    placeholder="1234"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinCode(!showPinCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPinCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="41.3111"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="69.2797"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ish vaqti (hafta kunlari)</Label>
                <Input
                  placeholder="09:00 - 18:00"
                  value={formData.workingHoursWeekday}
                  onChange={(e) => setFormData({ ...formData, workingHoursWeekday: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ish vaqti (dam olish)</Label>
                <Input
                  placeholder="10:00 - 16:00"
                  value={formData.workingHoursWeekend}
                  onChange={(e) => setFormData({ ...formData, workingHoursWeekend: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Punktni tahrirlash</DialogTitle>
            <DialogDescription>
              {selectedPoint?.name} punktini tahrirlang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nomi *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Manzil *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Yangi PIN kod (ixtiyoriy)</Label>
                <div className="relative">
                  <Input
                    type={showPinCode ? "text" : "password"}
                    placeholder="O'zgartirilmaydi"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinCode(!showPinCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPinCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ish vaqti (hafta kunlari)</Label>
                <Input
                  value={formData.workingHoursWeekday}
                  onChange={(e) => setFormData({ ...formData, workingHoursWeekday: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ish vaqti (dam olish)</Label>
                <Input
                  value={formData.workingHoursWeekend}
                  onChange={(e) => setFormData({ ...formData, workingHoursWeekend: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedPoint(null); }}>
              Bekor qilish
            </Button>
            <Button onClick={handleEdit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Punktni o&apos;chirish</DialogTitle>
            <DialogDescription>
              &quot;{selectedPoint?.name}&quot; punktini o&apos;chirishni xohlaysizmi?
              {(selectedPoint?._count?.orders || 0) > 0 && (
                <span className="block mt-2 text-red-500">
                  Diqqat: Bu punktda {selectedPoint?._count?.orders} ta buyurtma mavjud!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedPoint(null); }}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              O&apos;chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
