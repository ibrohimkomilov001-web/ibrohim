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
  slug?: string | null;
  parent_id?: string | null;
  level: number;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
  _count?: { products: number };
  created_at?: string;
  [key: string]: any;
};

function mapCategory(c: any, depth = 0): Category {
  return {
    id: c.id,
    name_uz: c.nameUz || c.name_uz || '',
    name_ru: c.nameRu || c.name_ru || '',
    icon: c.icon || null,
    slug: c.slug || null,
    parent_id: c.parentId || c.parent_id || null,
    level: c.level ?? depth,
    sort_order: c.sortOrder ?? c.sort_order ?? 0,
    is_active: c.isActive ?? c.is_active ?? true,
    _count: c._count,
    children: (c.children || []).map((ch: any) => mapCategory(ch, depth + 1)),
    created_at: c.createdAt || c.created_at,
  };
}

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await fetchCategories();
    return (data || []).map((c: any) => mapCategory(c, 0));
  } catch {
    return [];
  }
}

/** Create category (any level — pass parentId for L1/L2) */
export async function createCategory(data: {
  nameUz: string;
  nameRu: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
}): Promise<void> {
  await apiCreateCategory({
    nameUz: data.nameUz,
    nameRu: data.nameRu,
    icon: data.icon || undefined,
    parentId: data.parentId || undefined,
    sortOrder: data.sortOrder || 0,
  });
}

/** Update category */
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

/** Delete category */
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

// ─── Child category operations (L1/L2) ───────

/** Create child category under a parent */
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

/** Update child category */
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

/** Delete child category */
export async function deleteSubcategoryAction(
  categoryId: string,
  subId: string
): Promise<void> {
  await apiDeleteSubcategory(categoryId, subId);
}