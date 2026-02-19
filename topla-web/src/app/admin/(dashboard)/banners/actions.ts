import { fetchBanners, createBanner as apiCreateBanner, updateBanner as apiUpdateBanner, deleteBanner as apiDeleteBanner } from "@/lib/api/admin";

export type Banner = {
  id: string;
  title: string;
  imageUrl?: string;
  link?: string;
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
      title: b.title,
      imageUrl: b.imageUrl,
      link: b.link,
      position: b.position,
      sortOrder: b.sortOrder,
      isActive: b.isActive,
      startDate: b.startDate,
      endDate: b.endDate,
    }));
  } catch {
    return [];
  }
}

export async function createBanner(data: Partial<Banner>): Promise<void> {
  await apiCreateBanner(data);
}

export async function updateBanner(id: string, data: Partial<Banner>): Promise<void> {
  await apiUpdateBanner(id, data);
}

export async function deleteBanner(id: string): Promise<void> {
  await apiDeleteBanner(id);
}