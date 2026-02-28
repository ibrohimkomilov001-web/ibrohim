import { fetchBanners, createBanner as apiCreateBanner, updateBanner as apiUpdateBanner, deleteBanner as apiDeleteBanner } from "@/lib/api/admin";

export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  link?: string;
  actionType?: string;
  position?: string;
  sortOrder?: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
};

export async function getBanners(): Promise<Banner[]> {
  try {
    const data = await fetchBanners();
    return (data || []).map((b: any) => ({
      id: b.id,
      title: b.titleUz || b.title_uz || b.title || '',
      subtitle: b.subtitleUz || b.subtitle_uz || '',
      imageUrl: b.imageUrl || b.image_url,
      actionType: b.actionType || b.action_type || 'none',
      link: b.actionValue || b.action_value || b.link,
      position: b.position,
      sortOrder: b.sortOrder ?? b.sort_order,
      isActive: b.isActive ?? b.is_active,
      startDate: b.startDate,
      endDate: b.endDate,
    }));
  } catch {
    return [];
  }
}

export async function createBanner(data: Partial<Banner>): Promise<void> {
  // Backend expects: imageUrl, titleUz, titleRu, subtitleUz, actionType, actionValue, sortOrder
  await apiCreateBanner({
    imageUrl: data.imageUrl,
    titleUz: data.title,
    subtitleUz: data.subtitle || undefined,
    actionType: data.actionType || (data.link ? 'link' : 'none'),
    actionValue: data.link || undefined,
    sortOrder: data.sortOrder || 0,
    isActive: data.isActive ?? true,
  });
}

export async function updateBanner(id: string, data: Partial<Banner>): Promise<void> {
  await apiUpdateBanner(id, data);
}

export async function deleteBanner(id: string): Promise<void> {
  await apiDeleteBanner(id);
}