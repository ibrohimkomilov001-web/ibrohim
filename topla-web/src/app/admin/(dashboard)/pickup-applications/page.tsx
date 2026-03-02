"use client";

import { useState, useEffect, useCallback } from "react";
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
  Search,
  MapPin,
  Phone,
  User,
  Clock,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  PhoneCall,
  AlertCircle,
  Ruler,
} from "lucide-react";
import {
  getApplications,
  getApplicationStats,
  changeApplicationStatus,
  removeApplication,
  type PickupApplication,
  type ApplicationStats,
} from "./actions";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  pending: { label: "Kutilmoqda", variant: "outline", color: "text-yellow-600 border-yellow-300 bg-yellow-50" },
  contacted: { label: "Bog'lanildi", variant: "secondary", color: "text-blue-600 border-blue-300 bg-blue-50" },
  approved: { label: "Tasdiqlandi", variant: "default", color: "text-green-600 border-green-300 bg-green-50" },
  rejected: { label: "Rad etildi", variant: "destructive", color: "text-red-600 border-red-300 bg-red-50" },
};

export default function AdminPickupApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<PickupApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    contacted: 0,
    approved: 0,
    rejected: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<PickupApplication | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const [appData, statsData] = await Promise.all([
        getApplications({ status: statusFilter || undefined, search: searchQuery || undefined, page }),
        getApplicationStats(),
      ]);
      setApplications(appData.applications);
      setPagination(appData.pagination);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      setError("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleStatusChange = async () => {
    if (!selectedApp || !newStatus) return;
    try {
      setActionLoading(true);
      await changeApplicationStatus(selectedApp.id, newStatus, adminNote || undefined);
      setSuccess(`Ariza statusi "${statusConfig[newStatus]?.label}" ga o'zgartirildi`);
      setStatusDialogOpen(false);
      setAdminNote("");
      loadData(pagination.page);
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      await removeApplication(selectedApp.id);
      setSuccess("Ariza o'chirildi");
      setDeleteDialogOpen(false);
      loadData(pagination.page);
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Punkt arizalari</h1>
        <p className="text-muted-foreground text-sm">
          Topshirish punkti ochish uchun kelgan arizalar
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Jami", value: stats.total, color: "text-gray-800" },
          { label: "Kutilmoqda", value: stats.pending, color: "text-yellow-600" },
          { label: "Bog'lanildi", value: stats.contacted, color: "text-blue-600" },
          { label: "Tasdiqlandi", value: stats.approved, color: "text-green-600" },
          { label: "Rad etildi", value: stats.rejected, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ism, telefon yoki shahar bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadData()}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Barcha statuslar</option>
              <option value="pending">Kutilmoqda</option>
              <option value="contacted">Bog&apos;lanildi</option>
              <option value="approved">Tasdiqlandi</option>
              <option value="rejected">Rad etildi</option>
            </select>
            <Button variant="outline" onClick={() => loadData()}>
              Qidirish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Arizalar ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Arizalar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{app.fullName}</span>
                      <Badge className={statusConfig[app.status]?.color || ""}>
                        {statusConfig[app.status]?.label || app.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {app.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {app.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(app.createdAt)}
                      </span>
                      {app.areaSize && (
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3.5 w-3.5" />
                          {app.areaSize} m²
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ko&apos;rish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setNewStatus(app.status === "pending" ? "contacted" : app.status);
                        setAdminNote(app.adminNote || "");
                        setStatusDialogOpen(true);
                      }}
                    >
                      Status
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setSelectedApp(app);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => loadData(pagination.page - 1)}
              >
                Oldingi
              </Button>
              <span className="text-sm text-muted-foreground">
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadData(pagination.page + 1)}
              >
                Keyingi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ariza tafsilotlari</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Ism</Label>
                  <p className="font-medium flex items-center gap-1.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {selectedApp.fullName}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Telefon</Label>
                  <p className="font-medium flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedApp.phone}`} className="text-blue-600 hover:underline">
                      {selectedApp.phone}
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Shahar</Label>
                  <p className="font-medium flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {selectedApp.city}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={statusConfig[selectedApp.status]?.color || ""}>
                    {statusConfig[selectedApp.status]?.label || selectedApp.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Manzil</Label>
                <p className="text-sm">{selectedApp.address}</p>
              </div>

              {selectedApp.areaSize && (
                <div>
                  <Label className="text-xs text-muted-foreground">Joy maydoni</Label>
                  <p className="text-sm">{selectedApp.areaSize} m²</p>
                </div>
              )}

              {selectedApp.note && (
                <div>
                  <Label className="text-xs text-muted-foreground">Qo&apos;shimcha izoh</Label>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedApp.note}</p>
                </div>
              )}

              {selectedApp.adminNote && (
                <div>
                  <Label className="text-xs text-muted-foreground">Admin izohi</Label>
                  <p className="text-sm bg-amber-50 border border-amber-200 p-3 rounded-lg">{selectedApp.adminNote}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span>Yuborilgan: {formatDate(selectedApp.createdAt)}</span>
                {selectedApp.reviewedAt && (
                  <span>Ko&apos;rib chiqilgan: {formatDate(selectedApp.reviewedAt)}</span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDetailDialogOpen(false);
                if (selectedApp) {
                  setNewStatus(selectedApp.status === "pending" ? "contacted" : selectedApp.status);
                  setAdminNote(selectedApp.adminNote || "");
                  setStatusDialogOpen(true);
                }
              }}
            >
              Statusni o&apos;zgartirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ariza statusini o&apos;zgartirish</DialogTitle>
            <DialogDescription>
              {selectedApp?.fullName} — {selectedApp?.city}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pending">Kutilmoqda</option>
                <option value="contacted">Bog&apos;lanildi</option>
                <option value="approved">Tasdiqlandi</option>
                <option value="rejected">Rad etildi</option>
              </select>
            </div>
            <div>
              <Label>Admin izohi (ixtiyoriy)</Label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Izoh qo'shing..."
                rows={3}
                className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleStatusChange} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arizani o&apos;chirish</DialogTitle>
            <DialogDescription>
              {selectedApp?.fullName} ning arizasini o&apos;chirishni xohlaysizmi? Bu amalni qaytarib bo&apos;lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              O&apos;chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
