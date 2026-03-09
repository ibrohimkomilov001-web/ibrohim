import { fetchBanners, createBanner as apiCreateBanner, updateBanner as apiUpdateBanner, deleteBanner as apiDeleteBanner } from "@/lib/api/admin";

export type Banner = {
  id: string;
  titleUz: string;
  titleRu: string;
  subtitleUz: string;
  subtitleRu: string;
  imageUrl: string;
  actionType: string;
  actionValue: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export async function getBanners(): Promise<Banner[]> {
  try {
    const data = await fetchBanners();
    return (data || []).map((b: any) => ({
      id: b.id,
      titleUz: b.titleUz || b.title_uz || '',
      titleRu: b.titleRu || b.title_ru || '',
      subtitleUz: b.subtitleUz || b.subtitle_uz || '',
      subtitleRu: b.subtitleRu || b.subtitle_ru || '',
      imageUrl: b.imageUrl || b.image_url || '',
      actionType: b.actionType || b.action_type || 'none',
      actionValue: b.actionValue || b.action_value || '',
      sortOrder: b.sortOrder ?? b.sort_order ?? 0,
      isActive: b.isActive ?? b.is_active ?? true,
      createdAt: b.createdAt || b.created_at || '',
    }));
  } catch {
    return [];
  }
}

export async function createBanner(data: {
  imageUrl: string;
  titleUz: string;
  titleRu?: string;
  subtitleUz?: string;
  subtitleRu?: string;
  actionType?: string;
  actionValue?: string;
  sortOrder?: number;
}): Promise<void> {
  await apiCreateBanner({
    imageUrl: data.imageUrl,
    titleUz: data.titleUz,
    titleRu: data.titleRu || undefined,
    subtitleUz: data.subtitleUz || undefined,
    subtitleRu: data.subtitleRu || undefined,
    actionType: data.actionType || 'none',
    actionValue: data.actionValue || undefined,
    sortOrder: data.sortOrder ?? 0,
  });
}

export async function updateBanner(id: string, data: Partial<Omit<Banner, 'id' | 'createdAt'>>): Promise<void> {
  // Map to backend field names
  const payload: Record<string, any> = {};
  if (data.titleUz !== undefined) payload.titleUz = data.titleUz;
  if (data.titleRu !== undefined) payload.titleRu = data.titleRu;
  if (data.subtitleUz !== undefined) payload.subtitleUz = data.subtitleUz;
  if (data.subtitleRu !== undefined) payload.subtitleRu = data.subtitleRu;
  if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
  if (data.actionType !== undefined) payload.actionType = data.actionType;
  if (data.actionValue !== undefined) payload.actionValue = data.actionValue;
  if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  await apiUpdateBanner(id, payload);
}

export async function deleteBanner(id: string): Promise<void> {
  await apiDeleteBanner(id);
}