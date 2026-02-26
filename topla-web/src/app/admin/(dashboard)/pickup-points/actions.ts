import {
  fetchAdminPickupPoints,
  createAdminPickupPoint,
  updateAdminPickupPoint,
  deleteAdminPickupPoint,
} from "@/lib/api/admin";

export type PickupPoint = {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  workingHours: any;
  isActive: boolean;
  loginCode: string;
  createdAt: string;
  _count?: { orders: number };
};

export async function getPickupPoints(): Promise<PickupPoint[]> {
  try {
    const data = await fetchAdminPickupPoints();
    return data?.pickupPoints || data || [];
  } catch {
    return [];
  }
}

export async function getPickupPointStats(): Promise<{ total: number; active: number; inactive: number }> {
  try {
    const points = await getPickupPoints();
    return {
      total: points.length,
      active: points.filter((p) => p.isActive).length,
      inactive: points.filter((p) => !p.isActive).length,
    };
  } catch {
    return { total: 0, active: 0, inactive: 0 };
  }
}

export async function createPickupPoint(data: {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  workingHours?: any;
  loginCode: string;
  pinCode: string;
}): Promise<void> {
  await createAdminPickupPoint(data);
}

export async function togglePickupPointStatus(id: string, isActive: boolean): Promise<void> {
  await updateAdminPickupPoint(id, { isActive });
}

export async function editPickupPoint(id: string, data: Partial<PickupPoint & { pinCode?: string }>): Promise<void> {
  await updateAdminPickupPoint(id, data);
}

export async function removePickupPoint(id: string): Promise<void> {
  await deleteAdminPickupPoint(id);
}
