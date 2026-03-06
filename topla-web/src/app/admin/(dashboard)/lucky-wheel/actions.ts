import {
  fetchLuckyWheelPrizes,
  createLuckyWheelPrize as apiCreate,
  updateLuckyWheelPrize as apiUpdate,
  deleteLuckyWheelPrize as apiDelete,
  fetchLuckyWheelSpins,
} from "@/lib/api/admin";

export type PrizeType = "discount_percent" | "discount_fixed" | "free_delivery" | "physical_gift" | "nothing";

export type LuckyWheelPrize = {
  id: string;
  nameUz: string;
  nameRu: string;
  type: PrizeType;
  value: string | null;
  probability: number;
  color: string;
  imageUrl: string | null;
  promoCodePrefix: string | null;
  stock: number | null;
  totalWon: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export type SpinRecord = {
  id: string;
  userId: string;
  prizeType: string;
  prizeName: string;
  promoCode: string | null;
  spinDate: string;
  createdAt: string;
  user: {
    fullName: string | null;
    phone: string | null;
  };
  prize: {
    nameUz: string;
    type: string;
    color: string;
  };
};

export type LuckyWheelStats = {
  totalSpins: number;
  todaySpins: number;
  totalWinners: number;
};

export async function getPrizes(): Promise<{ prizes: LuckyWheelPrize[]; stats: LuckyWheelStats }> {
  try {
    const res = await fetchLuckyWheelPrizes();
    return {
      prizes: (res.prizes || []).map((p: any) => ({
        id: p.id,
        nameUz: p.nameUz,
        nameRu: p.nameRu,
        type: p.type,
        value: p.value,
        probability: Number(p.probability),
        color: p.color || "#666",
        imageUrl: p.imageUrl,
        promoCodePrefix: p.promoCodePrefix,
        stock: p.stock,
        totalWon: p.totalWon || 0,
        sortOrder: p.sortOrder || 0,
        isActive: p.isActive,
        createdAt: p.createdAt,
      })),
      stats: res.stats || { totalSpins: 0, todaySpins: 0, totalWinners: 0 },
    };
  } catch {
    return { prizes: [], stats: { totalSpins: 0, todaySpins: 0, totalWinners: 0 } };
  }
}

export async function createPrize(data: Partial<LuckyWheelPrize>): Promise<void> {
  await apiCreate({
    nameUz: data.nameUz,
    nameRu: data.nameRu,
    type: data.type,
    value: data.value ? Number(data.value) : undefined,
    probability: data.probability,
    color: data.color,
    promoCodePrefix: data.promoCodePrefix,
    stock: data.stock,
    sortOrder: data.sortOrder,
    isActive: data.isActive ?? true,
  });
}

export async function updatePrize(id: string, data: Partial<LuckyWheelPrize>): Promise<void> {
  await apiUpdate(id, {
    nameUz: data.nameUz,
    nameRu: data.nameRu,
    type: data.type,
    value: data.value ? Number(data.value) : undefined,
    probability: data.probability,
    color: data.color,
    promoCodePrefix: data.promoCodePrefix,
    stock: data.stock,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
  });
}

export async function deletePrize(id: string): Promise<void> {
  await apiDelete(id);
}

export async function getSpins(params?: { page?: number; limit?: number }): Promise<{
  spins: SpinRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  try {
    const res = await fetchLuckyWheelSpins(params);
    return {
      spins: (res.spins || []).map((s: any) => ({
        id: s.id,
        userId: s.userId,
        prizeType: s.prizeType,
        prizeName: s.prizeName,
        promoCode: s.promoCode,
        spinDate: s.spinDate,
        createdAt: s.createdAt,
        user: {
          fullName: s.user?.fullName || "Noma'lum",
          phone: s.user?.phone || "",
        },
        prize: {
          nameUz: s.prize?.nameUz || s.prizeName,
          type: s.prize?.type || s.prizeType,
          color: s.prize?.color || "#666",
        },
      })),
      pagination: res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  } catch {
    return { spins: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}
