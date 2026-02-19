'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, ChevronDown, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shopApi } from '@/lib/api/shop';
import { ProductCard, ProductGrid } from '@/components/shop/product-card';
import { useTranslation } from '@/store/locale-store';

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useTranslation();
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);

  const sortOptions = [
    { value: 'newest', label: locale === 'ru' ? 'Новинки' : 'Yangi' },
    { value: 'popular', label: locale === 'ru' ? 'Популярные' : 'Mashhur' },
    { value: 'price_asc', label: locale === 'ru' ? 'Дешевле' : 'Arzon→Qimmat' },
    { value: 'price_desc', label: locale === 'ru' ? 'Дороже' : 'Qimmat→Arzon' },
    { value: 'rating', label: locale === 'ru' ? 'Рейтинг' : 'Reyting' },
  ];

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => shopApi.getCategories(),
  });

  const category = categories.find((c) => c.id === id);
  const catName = category
    ? (locale === 'ru' && category.nameRu ? category.nameRu : category.nameUz)
    : t('categories');

  const params: Record<string, string> = {
    categoryId: id,
    sortBy,
    page: String(page),
    limit: '24',
  };
  if (subcategoryId) params.subcategoryId = subcategoryId;

  const { data, isLoading } = useQuery({
    queryKey: ['category-products', id, sortBy, page, subcategoryId],
    queryFn: () => shopApi.getProducts(params),
    enabled: !!id,
  });

  const products = data?.products ?? [];
  const pagination = data?.pagination;
  const currentSort = sortOptions.find((o) => o.value === sortBy);

  return (
    <div className="site-container py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
        <span className="mx-2">/</span>
        <Link href="/categories" className="hover:text-primary transition-colors">{t('categories')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{catName}</span>
      </nav>

      {/* Page title */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {category?.icon && (
            <span className="text-3xl">{category.icon}</span>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{catName}</h1>
            {pagination && (
              <p className="text-sm text-muted-foreground">
                {pagination.total} {t('results')}
              </p>
            )}
          </div>
        </div>

        {/* Desktop sort + filter */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-glass flex items-center gap-2 text-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('sort')}: {currentSort?.label}
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 glass rounded-xl p-2 w-48 z-50 space-y-1"
                >
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowFilters(false); setPage(1); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                        sortBy === opt.value ? 'bg-primary text-white' : 'hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                      {sortBy === opt.value && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile sort button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden p-2.5 rounded-xl glass"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile sort dropdown */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden overflow-hidden mb-4"
          >
            <div className="glass rounded-xl p-3 space-y-1">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setShowFilters(false); setPage(1); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    sortBy === opt.value ? 'bg-primary text-white' : 'hover:bg-muted'
                  }`}
                >
                  {opt.label}
                  {sortBy === opt.value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subcategory pills */}
      {category?.subcategories && category.subcategories.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => { setSubcategoryId(null); setPage(1); }}
            className={`category-pill text-sm whitespace-nowrap ${!subcategoryId ? 'active' : ''}`}
          >
            {locale === 'ru' ? 'Все' : 'Barchasi'}
          </button>
          {category.subcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => { setSubcategoryId(sub.id === subcategoryId ? null : sub.id); setPage(1); }}
              className={`category-pill text-sm whitespace-nowrap ${sub.id === subcategoryId ? 'active' : ''}`}
            >
              {locale === 'ru' && sub.nameRu ? sub.nameRu : sub.nameUz}
            </button>
          ))}
        </div>
      )}

      {/* Active filters */}
      {subcategoryId && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">{t('filter')}:</span>
          <button
            onClick={() => { setSubcategoryId(null); setPage(1); }}
            className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full"
          >
            {category?.subcategories?.find(s => s.id === subcategoryId)
              ? (locale === 'ru' && category.subcategories.find(s => s.id === subcategoryId)?.nameRu
                ? category.subcategories.find(s => s.id === subcategoryId)!.nameRu
                : category.subcategories.find(s => s.id === subcategoryId)!.nameUz)
              : ''
            }
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square skeleton" />
              <div className="p-3 space-y-2">
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-3 skeleton rounded w-1/2" />
                <div className="h-5 skeleton rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg font-medium mb-2">{t('noResults')}</p>
          <p className="text-sm text-muted-foreground">{t('tryOther')}</p>
        </div>
      ) : (
        <>
          <ProductGrid products={products} columns={5} />

          {/* Load more */}
          {pagination && pagination.page < pagination.totalPages && (
            <div className="text-center mt-8">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="btn-glass px-8 py-3 text-sm font-medium text-primary inline-flex items-center gap-2"
              >
                {t('loadMore')}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
