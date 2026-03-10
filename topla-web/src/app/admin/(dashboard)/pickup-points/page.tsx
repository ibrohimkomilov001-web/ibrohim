"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  CheckCircle,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/charts";
import {
  getPickupPoints,
  getPickupPointStats,
  createPickupPoint,
  togglePickupPointStatus,
  editPickupPoint,
  removePickupPoint,
  type PickupPoint,
} from "./actions";
import { useTranslation } from '@/store/locale-store';

export default function AdminPickupPointsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: points = [], isLoading: pointsLoading } = useQuery({
    queryKey: ["pickupPoints"],
    queryFn: getPickupPoints,
  });

  const { data: stats = { total: 0, active: 0, inactive: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ["pickupPointStats"],
    queryFn: getPickupPointStats,
  });

  const loading = pointsLoading || statsLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
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

  const invalidatePickupData = () => {
    queryClient.invalidateQueries({ queryKey: ["pickupPoints"] });
    queryClient.invalidateQueries({ queryKey: ["pickupPointStats"] });
  };

  const createMutation = useMutation({
    mutationFn: createPickupPoint,
    onSuccess: () => invalidatePickupData(),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => editPickupPoint(id, data),
    onSuccess: () => invalidatePickupData(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => togglePickupPointStatus(id, isActive),
    onSuccess: () => invalidatePickupData(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removePickupPoint(id),
    onSuccess: () => invalidatePickupData(),
  });

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
      setError(t('requiredFieldsPickup'));
      return;
    }

    try {
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

      await createMutation.mutateAsync({
        name: formData.name,
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        phone: formData.phone || undefined,
        workingHours: Object.keys(workingHours).length ? workingHours : undefined,
        loginCode: formData.loginCode,
        pinCode: formData.pinCode,
      });
      setSuccess(t('pickupPointCreated'));
      setCreateDialogOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || t('createError'));
    }
  };

  const handleEdit = async () => {
    if (!selectedPoint || !formData.name || !formData.address) {
      setError(t('nameAndAddressRequired'));
      return;
    }

    try {
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

      await editMutation.mutateAsync({ id: selectedPoint.id, data: updateData });
      setSuccess(t('pickupPointUpdated'));
      setEditDialogOpen(false);
      resetForm();
      setSelectedPoint(null);
    } catch (err: any) {
      setError(err.message || t('updateError'));
    }
  };

  const handleToggleStatus = async (point: PickupPoint) => {
    try {
      await toggleMutation.mutateAsync({ id: point.id, isActive: !point.isActive });
      setSuccess(t('pickupPointStatusChanged'));
    } catch (err: any) {
      setError(err.message || t('statusChangeError'));
    }
  };

  const handleDelete = async () => {
    if (!selectedPoint) return;
    try {
      setError(null);
      await deleteMutation.mutateAsync(selectedPoint.id);
      setSuccess(t('pickupPointDeleted'));
      setDeleteDialogOpen(false);
      setSelectedPoint(null);
    } catch (err: any) {
      setError(err.message || t('deleteError'));
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
    setSuccess(t('copied'));
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
          <h1 className="text-2xl font-bold">{t('pickupPointsTitle')}</h1>
          <p className="text-muted-foreground">
            {t('pickupPointsDesc')}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          {t('newPickupPoint')}
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={MapPin} label={t('totalPoints')} value={stats.total} color="primary" />
        <StatCard icon={CheckCircle} label={t('active')} value={stats.active} color="success" />
        <StatCard icon={XCircle} label={t('inactive')} value={stats.inactive} color="warning" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchByNameAddressCode')}
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
              <p>{t('pickupPointsNotFound')}</p>
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
                        {point.isActive ? t('active') : t('inactive')}
                      </Badge>
                      {point._count?.orders !== undefined && (
                        <Badge variant="outline" className="gap-1">
                          <Package className="h-3 w-3" />
                          {point._count.orders} {t('ordersCount')}
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
                        {t('loginCode')}:
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
                      title={point.isActive ? t('disable') : t('enable')}
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
            <DialogTitle>{t('newPickupPointFull')}</DialogTitle>
            <DialogDescription>
              {t('createPickupPointDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>{t('nameRequired')}</Label>
                <Input
                  placeholder={t('pickupPointNameExample')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{t('addressRequired')}</Label>
                <Input
                  placeholder={t('addressExample')}
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
                <Label>{t('loginCodeRequired')}</Label>
                <Input
                  placeholder="PKT-001"
                  value={formData.loginCode}
                  onChange={(e) => setFormData({ ...formData, loginCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('pinCodeRequired')}</Label>
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
                <Label>{t('workingHoursWeekdays')}</Label>
                <Input
                  placeholder="09:00 - 18:00"
                  value={formData.workingHoursWeekday}
                  onChange={(e) => setFormData({ ...formData, workingHoursWeekday: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('workingHoursWeekend')}</Label>
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
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('editPickupPoint')}</DialogTitle>
            <DialogDescription>
              {selectedPoint?.name} punktini tahrirlang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>{t('nameRequired')}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{t('addressRequired')}</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('phone')}</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('newPinCodeOptional')}</Label>
                <div className="relative">
                  <Input
                    type={showPinCode ? "text" : "password"}
                    placeholder={t('unchanged')}
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
                <Label>{t('workingHoursWeekdays')}</Label>
                <Input
                  value={formData.workingHoursWeekday}
                  onChange={(e) => setFormData({ ...formData, workingHoursWeekday: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('workingHoursWeekend')}</Label>
                <Input
                  value={formData.workingHoursWeekend}
                  onChange={(e) => setFormData({ ...formData, workingHoursWeekend: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedPoint(null); }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending}>
              {editMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deletePickupPoint')}</DialogTitle>
            <DialogDescription>
              &quot;{selectedPoint?.name}&quot; {t('confirmDeletePickupPoint')}
              {(selectedPoint?._count?.orders || 0) > 0 && (
                <span className="block mt-2 text-red-500">
                  {t('warningOrdersExist')} ({selectedPoint?._count?.orders})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedPoint(null); }}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
