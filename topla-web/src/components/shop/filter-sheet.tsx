'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Search, Check, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { shopApi } from '@/lib/api/shop';
import { useLocaleStore } from '@/store/locale-store';

// ============================================
// Types
// ============================================
export interface FilterValues {
  categoryId?: string;
  brandIds: string[];
  colorIds: string[];
  sizeIds: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock: boolean;
  hasDiscount: boolean;
  isOriginal: boolean;
  deliveryHours?: number; // 24, 48, 72
  deliveryType?: 'courier' | 'pickup';
  sortBy?: string;
}

export const EMPTY_FILTERS: FilterValues = {
  brandIds: [],
  colorIds: [],
  sizeIds: [],
  inStock: false,
  hasDiscount: false,
  isOriginal: false,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (values: FilterValues) => void;
  initial?: FilterValues;
  categoryId?: string;
}

// ============================================
// FilterSheet
// ============================================
export function FilterSheet({ open, onClose, onApply, initial, categoryId }: Props) {
  const { locale } = useLocaleStore();
  const [values, setValues] = useState<FilterValues>(initial ?? EMPTY_FILTERS);
  const [brandSearch, setBrandSearch] = useState('');

  // Sync with parent when opens
  useEffect(() => {
    if (open) {
      setValues(initial ?? EMPTY_FILTERS);
      setBrandSearch('');
    }
  }, [open, initial]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Load facets
  const { data: brandsResp } = useQuery({
    queryKey: ['filter-brands', categoryId],
    queryFn: () => shopApi.getBrands(categoryId),
    enabled: open,
    staleTime: 5 * 60_000,
  });
  const { data: colorsResp } = useQuery({
    queryKey: ['filter-colors', categoryId],
    queryFn: () => shopApi.getColors(categoryId),
    enabled: open,
    staleTime: 5 * 60_000,
  });
  const { data: sizesResp } = useQuery({
    queryKey: ['filter-sizes', categoryId],
    queryFn: () => shopApi.getSizes(categoryId),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const brands = brandsResp?.data ?? [];
  const colors = colorsResp?.data ?? [];
  const sizes = sizesResp?.data ?? [];

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const s = brandSearch.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(s));
  }, [brands, brandSearch]);

  // Labels
  const L = locale === 'ru'
    ? {
        title: 'Фильтры',
        reset: 'Сбросить',
        price: 'Цена',
        min: 'От',
        max: 'До',
        brand: 'Бренд',
        searchBrand: 'Поиск бренда',
        color: 'Цвет',
        size: 'Размер',
        rating: 'Рейтинг',
        any: 'Любой',
        andHigher: 'и выше',
        availability: 'Доступность',
        inStock: 'В наличии',
        hasDiscount: 'Со скидкой',
        original: 'Оригинал',
        delivery: 'Доставка',
        deliveryHours: 'Срок',
        hours24: 'За 24 часа',
        hours48: 'За 48 часов',
        hours72: 'За 72 часа',
        deliveryType: 'Тип',
        courier: 'Курьер',
        pickup: 'Самовывоз',
        apply: 'Показать',
      }
    : {
        title: 'Filtrlar',
        reset: 'Tozalash',
        price: 'Narx',
        min: 'Dan',
        max: 'Gacha',
        brand: 'Brend',
        searchBrand: 'Brend qidirish',
        color: 'Rang',
        size: "O'lcham",
        rating: 'Reyting',
        any: 'Istalgan',
        andHigher: 'va undan yuqori',
        availability: 'Mavjudligi',
        inStock: 'Sotuvda',
        hasDiscount: 'Chegirmali',
        original: 'Original',
        delivery: 'Yetkazib berish',
        deliveryHours: 'Muddati',
        hours24: '24 soatda',
        hours48: '48 soatda',
        hours72: '72 soatda',
        deliveryType: 'Turi',
        courier: 'Kuryer',
        pickup: 'Olib ketish',
        apply: "Ko'rsatish",
      };

  const toggleIn = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const handleReset = () => setValues(EMPTY_FILTERS);

  const handleApply = () => {
    onApply(values);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel: bottom-sheet on mobile, right-drawer on desktop */}
      <div
        className="absolute bg-background shadow-2xl flex flex-col
          inset-x-0 bottom-0 max-h-[92vh] rounded-t-3xl
          sm:inset-y-0 sm:right-0 sm:bottom-auto sm:max-h-none sm:w-[420px] sm:rounded-l-2xl sm:rounded-tr-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{L.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-sm text-primary hover:underline"
            >
              {L.reset}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-6">
          {/* Price */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">{L.price}</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={L.min}
                value={values.minPrice ?? ''}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="h-11 px-3 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm"
              />
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={L.max}
                value={values.maxPrice ?? ''}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="h-11 px-3 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm"
              />
            </div>
          </section>

          {/* Rating */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">{L.rating}</h3>
            <div className="space-y-1">
              {[undefined, 4, 3, 2].map((r) => {
                const active = values.minRating === r;
                return (
                  <button
                    key={String(r)}
                    onClick={() => setValues((v) => ({ ...v, minRating: r }))}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        active ? 'border-blue-600 bg-blue-600' : 'border-muted-foreground/40'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                    {r === undefined ? (
                      <span className="text-sm text-foreground">{L.any}</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-foreground">
                        <span className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < r ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </span>
                        {r} {L.andHigher}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Availability */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">{L.availability}</h3>
            <div className="space-y-1">
              <ToggleRow
                label={L.inStock}
                active={values.inStock}
                onChange={(v) => setValues((x) => ({ ...x, inStock: v }))}
              />
              <ToggleRow
                label={L.hasDiscount}
                active={values.hasDiscount}
                onChange={(v) => setValues((x) => ({ ...x, hasDiscount: v }))}
              />
              <ToggleRow
                label={L.original}
                active={values.isOriginal}
                onChange={(v) => setValues((x) => ({ ...x, isOriginal: v }))}
              />
            </div>
          </section>

          {/* Delivery */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">{L.delivery}</h3>
            <p className="text-xs text-muted-foreground mb-2">{L.deliveryHours}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { v: 24, label: L.hours24 },
                { v: 48, label: L.hours48 },
                { v: 72, label: L.hours72 },
              ].map((opt) => {
                const active = values.deliveryHours === opt.v;
                return (
                  <button
                    key={opt.v}
                    onClick={() =>
                      setValues((v) => ({
                        ...v,
                        deliveryHours: active ? undefined : opt.v,
                      }))
                    }
                    className={`px-3.5 h-9 rounded-full text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-foreground hover:bg-muted/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{L.deliveryType}</p>
            <div className="flex flex-wrap gap-2">
              {([
                { v: 'courier', label: L.courier },
                { v: 'pickup', label: L.pickup },
              ] as const).map((opt) => {
                const active = values.deliveryType === opt.v;
                return (
                  <button
                    key={opt.v}
                    onClick={() =>
                      setValues((v) => ({
                        ...v,
                        deliveryType: active ? undefined : opt.v,
                      }))
                    }
                    className={`px-3.5 h-9 rounded-full text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-foreground hover:bg-muted/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Brands */}
          {brands.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">{L.brand}</h3>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder={L.searchBrand}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm"
                />
              </div>
              <div className="max-h-64 overflow-y-auto -mx-1 px-1">
                {filteredBrands.map((b) => {
                  const active = values.brandIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      onClick={() =>
                        setValues((v) => ({ ...v, brandIds: toggleIn(v.brandIds, b.id) }))
                      }
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          active ? 'bg-blue-600 border-blue-600' : 'border-muted-foreground/40'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 text-sm text-foreground truncate">{b.name}</span>
                      {b._count?.products !== undefined && (
                        <span className="text-xs text-muted-foreground">{b._count.products}</span>
                      )}
                    </button>
                  );
                })}
                {filteredBrands.length === 0 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">—</div>
                )}
              </div>
            </section>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">{L.color}</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const active = values.colorIds.includes(c.id);
                  const label = (locale === 'ru' && c.nameRu) ? c.nameRu : c.nameUz;
                  return (
                    <button
                      key={c.id}
                      onClick={() =>
                        setValues((v) => ({ ...v, colorIds: toggleIn(v.colorIds, c.id) }))
                      }
                      title={label}
                      className={`relative w-9 h-9 rounded-full border-2 transition-transform ${
                        active ? 'border-blue-600 scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: c.hexCode || '#ccc' }}
                    >
                      {active && (
                        <Check
                          className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow"
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">{L.size}</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const active = values.sizeIds.includes(s.id);
                  const label = (locale === 'ru' && s.nameRu) ? s.nameRu : s.nameUz;
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        setValues((v) => ({ ...v, sizeIds: toggleIn(v.sizeIds, s.id) }))
                      }
                      className={`min-w-[48px] h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-muted border-border text-foreground hover:bg-muted/70'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 bg-background" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
          <button
            onClick={handleApply}
            className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm active:scale-[0.98] transition-colors"
          >
            {L.apply}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================
function ToggleRow({
  label,
  active,
  onChange,
}: {
  label: string;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
    >
      <span
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          active ? 'bg-blue-600 border-blue-600' : 'border-muted-foreground/40'
        }`}
      >
        {active && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </span>
      <span className="flex-1 text-sm text-foreground">{label}</span>
    </button>
  );
}

// ============================================
// Utility: count active filters
// ============================================
export function countActiveFilters(v: FilterValues): number {
  let n = 0;
  if (v.minPrice !== undefined) n++;
  if (v.maxPrice !== undefined) n++;
  if (v.minRating !== undefined) n++;
  if (v.inStock) n++;
  if (v.hasDiscount) n++;
  if (v.isOriginal) n++;
  if (v.deliveryHours !== undefined) n++;
  if (v.deliveryType !== undefined) n++;
  n += v.brandIds.length;
  n += v.colorIds.length;
  n += v.sizeIds.length;
  return n;
}

// ============================================
// URL helpers
// ============================================
export function filtersToParams(v: FilterValues): Record<string, string> {
  const p: Record<string, string> = {};
  if (v.categoryId) p.categoryId = v.categoryId;
  if (v.minPrice !== undefined) p.minPrice = String(v.minPrice);
  if (v.maxPrice !== undefined) p.maxPrice = String(v.maxPrice);
  if (v.minRating !== undefined) p.minRating = String(v.minRating);
  if (v.inStock) p.inStock = 'true';
  if (v.hasDiscount) p.hasDiscount = 'true';
  if (v.isOriginal) p.isOriginal = 'true';
  if (v.deliveryHours !== undefined) p.deliveryHours = String(v.deliveryHours);
  if (v.deliveryType) p.deliveryType = v.deliveryType;
  if (v.brandIds.length) p.brandIds = v.brandIds.join(',');
  if (v.colorIds.length) p.colorIds = v.colorIds.join(',');
  if (v.sizeIds.length) p.sizeIds = v.sizeIds.join(',');
  if (v.sortBy) p.sortBy = v.sortBy;
  return p;
}
