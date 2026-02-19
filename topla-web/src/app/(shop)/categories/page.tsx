'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import { shopApi, type Category } from '@/lib/api/shop';
import { useTranslation } from '@/store/locale-store';

export default function CategoriesPage() {
  const { t, locale } = useTranslation();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => shopApi.getCategories(),
  });

  return (
    <div className="site-container py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{t('categories')}</span>
      </nav>

      {/* Page title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <LayoutGrid className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('allCategories')}</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">{categories.length} {t('categories').toLowerCase()}</p>
          )}
        </div>
      </div>

      {/* Category grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4 animate-pulse">
              <div className="w-14 h-14 skeleton rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 skeleton rounded w-1/2" />
                <div className="h-3 skeleton rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat: Category, index: number) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
            >
              <Link
                href={`/categories/${cat.id}`}
                className="glass rounded-2xl p-5 flex items-center gap-4 hover-spring block group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {cat.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {locale === 'ru' && cat.nameRu ? cat.nameRu : cat.nameUz}
                  </h3>
                  {cat._count?.products !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {cat._count.products} {t('shopProducts')}
                    </p>
                  )}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {cat.subcategories
                        .map((s) => locale === 'ru' && s.nameRu ? s.nameRu : s.nameUz)
                        .slice(0, 3)
                        .join(', ')}
                      {cat.subcategories.length > 3 && '...'}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
