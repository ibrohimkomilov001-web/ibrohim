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
  ClipboardList,
} from "lucide-react";
import { StatCard } from "@/components/charts";
import {
  getApplications,
  getApplicationStats,
  changeApplicationStatus,
  removeApplication,
  type PickupApplication,
} from "./actions";
import { useTranslation } from '@/store/locale-store';

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  pending: { label: "pending", variant: "outline", color: "text-yellow-600 border-yellow-300 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-700 dark:bg-yellow-950/20" },
  contacted: { label: "contacted", variant: "secondary", color: "text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-950/20" },
  approved: { label: "approved", variant: "default", color: "text-green-600 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950/20" },
  rejected: { label: "rejected", variant: "destructive", color: "text-red-600 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-700 dark:bg-red-950/20" },
};

export default function AdminPickupApplicationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<PickupApplication | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["pickup-applications", { page: currentPage, statusFilter, searchQuery }],
    queryFn: async () => {
      const [appData, statsData] = await Promise.all([
        getApplications({ status: statusFilter || undefined, search: searchQuery || undefined, page: currentPage }),
        getApplicationStats(),
      ]);
      return { appData, statsData };
    },
  });

  const applications = data?.appData.applications ?? [];
  const pagination = data?.appData.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 };
  const stats = data?.statsData ?? { total: 0, pending: 0, contacted: 0, approved: 0, rejected: 0 };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Sync query error to local error state
  useEffect(() => {
    if (isError) setError(t('dataLoadError'));
  }, [isError, t]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const statusMutation = useMutation({
    mutationFn: (params: { id: string; status: string; note?: string }) =>
      changeApplicationStatus(params.id, params.status, params.note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-applications"] });
      setSuccess(t('applicationStatusChanged'));
      setStatusDialogOpen(false);
      setAdminNote("");
    },
    onError: (err: any) => {
      setError(err.message || t('errorOccurred'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-applications"] });
      setSuccess(t('applicationDeleted'));
      setDeleteDialogOpen(false);
    },
    onError: (err: any) => {
      setError(err.message || t('errorOccurred'));
    },
  });

  const actionLoading = statusMutation.isPending || deleteMutation.isPending;

  const handleStatusChange = () => {
    if (!selectedApp || !newStatus) return;
    statusMutation.mutate({ id: selectedApp.id, status: newStatus, note: adminNote || undefined });
  };

  const handleDelete = () => {
    if (!selectedApp) return;
    deleteMutation.mutate(selectedApp.id);
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
        <h1 className="text-2xl font-bold">{t('pickupApplicationsTitle')}</h1>
        <p className="text-muted-foreground text-sm">
          {t('pickupApplicationsDesc')}
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard icon={ClipboardList} label={t('total')} value={stats.total} color="primary" />
        <StatCard icon={Clock} label={t('pending')} value={stats.pending} color="warning" />
        <StatCard icon={Phone} label={t('contacted')} value={stats.contacted} color="info" />
        <StatCard icon={CheckCircle} label={t('approved')} value={stats.approved} color="success" />
        <StatCard icon={XCircle} label={t('rejected')} value={stats.rejected} color="destructive" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchByNamePhoneCity')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refetch()}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="contacted">{t('contacted')}</option>
              <option value="approved">{t('approved')}</option>
              <option value="rejected">{t('rejected')}</option>
            </select>
            <Button variant="outline" onClick={() => refetch()}>
              {t('search')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t('applications')} ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('applicationsNotFound')}</p>
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
                        {t(statusConfig[app.status]?.label) || app.status}
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
                      {t('view')}
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
                onClick={() => setCurrentPage(p => p - 1)}
              >
                {t('previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                {t('next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('applicationDetails')}</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">{t('fullName')}</Label>
                  <p className="font-medium flex items-center gap-1.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {selectedApp.fullName}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('phone')}</Label>
                  <p className="font-medium flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedApp.phone}`} className="text-blue-600 hover:underline">
                      {selectedApp.phone}
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('city')}</Label>
                  <p className="font-medium flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {selectedApp.city}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('status')}</Label>
                  <Badge className={statusConfig[selectedApp.status]?.color || ""}>
                    {t(statusConfig[selectedApp.status]?.label) || selectedApp.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">{t('address')}</Label>
                <p className="text-sm">{selectedApp.address}</p>
              </div>

              {selectedApp.areaSize && (
                <div>
                  <Label className="text-xs text-muted-foreground">{t('areaSize')}</Label>
                  <p className="text-sm">{selectedApp.areaSize} m²</p>
                </div>
              )}

              {selectedApp.note && (
                <div>
                  <Label className="text-xs text-muted-foreground">{t('additionalNote')}</Label>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedApp.note}</p>
                </div>
              )}

              {selectedApp.adminNote && (
                <div>
                  <Label className="text-xs text-muted-foreground">{t('adminNote')}</Label>
                  <p className="text-sm bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 p-3 rounded-lg">{selectedApp.adminNote}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span>{t('submitted')}: {formatDate(selectedApp.createdAt)}</span>
                {selectedApp.reviewedAt && (
                  <span>{t('reviewed')}: {formatDate(selectedApp.reviewedAt)}</span>
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
              {t('changeStatus')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('changeApplicationStatus')}</DialogTitle>
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
                <option value="pending">{t('pending')}</option>
                <option value="contacted">{t('contacted')}</option>
                <option value="approved">{t('approved')}</option>
                <option value="rejected">{t('rejected')}</option>
              </select>
            </div>
            <div>
              <Label>{t('adminNoteOptional')}</Label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={t('addNotePlaceholder')}
                rows={3}
                className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleStatusChange} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteApplication')}</DialogTitle>
            <DialogDescription>
              {selectedApp?.fullName} {t('confirmDeleteApplication')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
