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
  ctaText: string;
  ctaTextRu: string;
  bgColor: string;
  textColor: string;
  textPosition: 'left' | 'center' | 'right';
  startsAt: string | null;
  endsAt: string | null;
  clickCount: number;
  viewCount: number;
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
      ctaText: b.ctaText || b.cta_text || '',
      ctaTextRu: b.ctaTextRu || b.cta_text_ru || '',
      bgColor: b.bgColor || b.bg_color || '',
      textColor: b.textColor || b.text_color || '',
      textPosition: (b.textPosition || b.text_position || 'left') as 'left' | 'center' | 'right',
      startsAt: b.startsAt || b.starts_at || null,
      endsAt: b.endsAt || b.ends_at || null,
      clickCount: b.clickCount ?? b.click_count ?? 0,
      viewCount: b.viewCount ?? b.view_count ?? 0,
      sortOrder: b.sortOrder ?? b.sort_order ?? 0,
      isActive: b.isActive ?? b.is_active ?? true,
      createdAt: b.createdAt || b.created_at || '',
    }));
  } catch {
    return [];
  }
}

type BannerCreateInput = {
  imageUrl: string;
  titleUz?: string;
  titleRu?: string;
  subtitleUz?: string;
  subtitleRu?: string;
  actionType?: string;
  actionValue?: string;
  ctaText?: string;
  ctaTextRu?: string;
  bgColor?: string;
  textColor?: string;
  textPosition?: 'left' | 'center' | 'right';
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder?: number;
};

export async function createBanner(data: BannerCreateInput): Promise<void> {
  await apiCreateBanner({
    imageUrl: data.imageUrl,
    titleUz: data.titleUz || undefined,
    titleRu: data.titleRu || undefined,
    subtitleUz: data.subtitleUz || undefined,
    subtitleRu: data.subtitleRu || undefined,
    actionType: data.actionType || 'none',
    actionValue: data.actionValue || undefined,
    ctaText: data.ctaText || undefined,
    ctaTextRu: data.ctaTextRu || undefined,
    bgColor: data.bgColor || undefined,
    textColor: data.textColor || undefined,
    textPosition: data.textPosition || undefined,
    startsAt: data.startsAt || undefined,
    endsAt: data.endsAt || undefined,
    sortOrder: data.sortOrder ?? 0,
  });
}

export async function updateBanner(id: string, data: Partial<Omit<Banner, 'id' | 'createdAt' | 'clickCount' | 'viewCount'>>): Promise<void> {
  const payload: Record<string, any> = {};
  if (data.titleUz !== undefined) payload.titleUz = data.titleUz || null;
  if (data.titleRu !== undefined) payload.titleRu = data.titleRu || null;
  if (data.subtitleUz !== undefined) payload.subtitleUz = data.subtitleUz || null;
  if (data.subtitleRu !== undefined) payload.subtitleRu = data.subtitleRu || null;
  if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
  if (data.actionType !== undefined) payload.actionType = data.actionType;
  if (data.actionValue !== undefined) payload.actionValue = data.actionValue || null;
  if (data.ctaText !== undefined) payload.ctaText = data.ctaText || null;
  if (data.ctaTextRu !== undefined) payload.ctaTextRu = data.ctaTextRu || null;
  if (data.bgColor !== undefined) payload.bgColor = data.bgColor || null;
  if (data.textColor !== undefined) payload.textColor = data.textColor || null;
  if (data.textPosition !== undefined) payload.textPosition = data.textPosition;
  if (data.startsAt !== undefined) payload.startsAt = data.startsAt || null;
  if (data.endsAt !== undefined) payload.endsAt = data.endsAt || null;
  if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  await apiUpdateBanner(id, payload);
}

export async function deleteBanner(id: string): Promise<void> {
  await apiDeleteBanner(id);
}