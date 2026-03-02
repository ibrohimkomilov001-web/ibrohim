import {
  fetchPickupApplications,
  fetchPickupApplicationStats,
  updatePickupApplication,
  deletePickupApplication,
} from "@/lib/api/admin";

export type PickupApplication = {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  areaSize: number | null;
  note: string | null;
  status: "pending" | "contacted" | "approved" | "rejected";
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationStats = {
  total: number;
  pending: number;
  contacted: number;
  approved: number;
  rejected: number;
};

export async function getApplications(params?: {
  status?: string;
  search?: string;
  page?: number;
}): Promise<{ applications: PickupApplication[]; pagination: any }> {
  const res = await fetchPickupApplications(params);
  return {
    applications: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
  };
}

export async function getApplicationStats(): Promise<ApplicationStats> {
  const res = await fetchPickupApplicationStats();
  return res.data || { total: 0, pending: 0, contacted: 0, approved: 0, rejected: 0 };
}

export async function changeApplicationStatus(
  id: string,
  status: string,
  adminNote?: string
): Promise<void> {
  await updatePickupApplication(id, { status, adminNote });
}

export async function removeApplication(id: string): Promise<void> {
  await deletePickupApplication(id);
}
