import { fetchDeliveryZones, createDeliveryZone as apiCreateDeliveryZone, deleteDeliveryZone as apiDeleteDeliveryZone, updateDeliveryZone as apiUpdateDeliveryZone } from "@/lib/api/admin";

export type DeliveryZone = {
  id: string;
  name: string;
  region?: string | null;
  districts?: string[];
  delivery_fee: number;
  min_order_amount: number;
  estimated_time?: string | null;
  is_active: boolean;
  [key: string]: any;
};

export async function getDeliveryZonesWithStats(): Promise<{
  zones: DeliveryZone[];
  stats: { total: number; active: number; inactive: number };
}> {
  try {
    const data = await fetchDeliveryZones();
    const zones = (data || []).map((z: any) => ({
      id: z.id,
      name: z.name,
      region: z.region,
      districts: z.districts,
      delivery_fee: Number(z.deliveryFee || 0),
      min_order_amount: Number(z.minOrderAmount || 0),
      estimated_time: z.estimatedTime,
      is_active: z.isActive,
    }));
    return {
      zones,
      stats: {
        total: zones.length,
        active: zones.filter((z: DeliveryZone) => z.is_active).length,
        inactive: zones.filter((z: DeliveryZone) => !z.is_active).length,
      },
    };
  } catch {
    return { zones: [], stats: { total: 0, active: 0, inactive: 0 } };
  }
}

export async function createDeliveryZone(data: Partial<DeliveryZone>): Promise<void> {
  await apiCreateDeliveryZone({
    name: data.name,
    region: data.region,
    districts: data.districts,
    deliveryFee: data.delivery_fee,
    minOrderAmount: data.min_order_amount,
    estimatedTime: data.estimated_time,
    isActive: data.is_active,
  });
}

export async function toggleDeliveryZoneStatus(id: string, isActive: boolean): Promise<void> {
  await apiUpdateDeliveryZone(id, { isActive });
}

export async function updateDeliveryZone(id: string, data: Partial<DeliveryZone>): Promise<void> {
  await apiUpdateDeliveryZone(id, {
    name: data.name,
    region: data.region,
    districts: data.districts,
    deliveryFee: data.delivery_fee,
    minOrderAmount: data.min_order_amount,
    estimatedTime: data.estimated_time,
    isActive: data.is_active,
  });
}

export async function deleteDeliveryZone(id: string): Promise<void> {
  await apiDeleteDeliveryZone(id);
}