import {
  fetchCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
  createSubcategory as apiCreateSubcategory,
  updateSubcategory as apiUpdateSubcategory,
  deleteSubcategory as apiDeleteSubcategory,
} from "@/lib/api/admin";

export type Category = {
  id: string;
  name_uz: string;
  name_ru?: string | null;
  icon?: string | null;
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
  created_at?: string;
  [key: string]: any;
};

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await fetchCategories();
    return (data || []).map((c: any) => ({
      id: c.id,
      name_uz: c.nameUz || c.name_uz || '',
      name_ru: c.nameRu || c.name_ru || '',
      icon: c.icon || null,
      sort_order: c.sortOrder ?? c.sort_order ?? 0,
      is_active: c.isActive ?? c.is_active ?? true,
      children: (c.subcategories || []).map((s: any) => ({
        id: s.id,
        name_uz: s.nameUz || s.name_uz || '',
        name_ru: s.nameRu || s.name_ru || '',
        parent_id: c.id,
        sort_order: s.sortOrder ?? s.sort_order ?? 0,
        is_active: s.isActive ?? s.is_active ?? true,
      })),
      created_at: c.createdAt || c.created_at,
    }));
  } catch {
    return [];
  }
}

/** Create main category */
export async function createCategory(data: {
  nameUz: string;
  nameRu: string;
  icon?: string;
  sortOrder?: number;
}): Promise<void> {
  await apiCreateCategory({
    nameUz: data.nameUz,
    nameRu: data.nameRu,
    icon: data.icon || undefined,
    sortOrder: data.sortOrder || 0,
  });
}

/** Update main category */
export async function updateCategory(
  id: string,
  data: {
    nameUz?: string;
    nameRu?: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
): Promise<void> {
  await apiUpdateCategory(id, data);
}

/** Delete main category */
export async function deleteCategory(id: string): Promise<void> {
  await apiDeleteCategory(id);
}

/** Toggle active status */
export async function toggleCategoryStatus(
  id: string,
  isActive: boolean
): Promise<void> {
  await apiUpdateCategory(id, { isActive });
}

// ─── Subcategory operations ───────────────────

/** Create subcategory under a parent category */
export async function createSubcategory(data: {
  categoryId: string;
  nameUz: string;
  nameRu: string;
  sortOrder?: number;
}): Promise<void> {
  await apiCreateSubcategory(data.categoryId, {
    nameUz: data.nameUz,
    nameRu: data.nameRu,
    sortOrder: data.sortOrder || 0,
  });
}

/** Update subcategory */
export async function updateSubcategory(
  categoryId: string,
  subId: string,
  data: {
    nameUz?: string;
    nameRu?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
): Promise<void> {
  await apiUpdateSubcategory(categoryId, subId, data);
}

/** Delete subcategory */
export async function deleteSubcategoryAction(
  categoryId: string,
  subId: string
): Promise<void> {
  await apiDeleteSubcategory(categoryId, subId);
}