'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavoritesStore } from '@/store/favorites-store';
import { useTranslation } from '@/store/locale-store';
import { useQuery } from '@tanstack/react-query';
import { shopApi } from '@/lib/api/shop';
import { ProductCard } from '@/components/shop/product-card';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { favorites } = useFavoritesStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'favorites', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      // Fetch all products and filter by favorites
      const res = await shopApi.getProducts({ limit: '100' });
      return (res.products ?? []).filter((p) => favorites.includes(p.id));
    },
    enabled: mounted && favorites.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (!mounted) return null;

  return (
    <div className="site-container py-6 sm:py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('home')}
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium">{t('favorites')}</span>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-md shadow-red-500/20">
          <Heart className="w-5 h-5 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">{t('favorites')}</h1>
          {favorites.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {favorites.length} {favorites.length === 1 ? 'mahsulot' : 'ta mahsulot'}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-foreground/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-5">
            <Heart className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h2 className="text-lg font-semibold mb-2">
            {t('favorites')} {t('emptyCart').split(' ')[1] || "bo'sh"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {t('about') === 'О нас'
              ? 'Добавляйте товары в избранное, чтобы не потерять их'
              : "Mahsulotlarni sevimlilar ro'yxatiga qo'shing"}
          </p>
          <Link
            href="/"
            className="liquid-btn inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {t('startShopping')}
          </Link>
        </motion.div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: favorites.length }).map((_, i) => (
            <div key={i} className="product-card">
              <div className="aspect-square skeleton" />
              <div className="p-3 space-y-2">
                <div className="h-4 skeleton w-3/4" />
                <div className="h-4 skeleton w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {products?.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
