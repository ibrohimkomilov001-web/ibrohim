'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { shopApi, type Banner, type Category } from '@/lib/api/shop';
import { ProductCard, ProductGrid } from '@/components/shop/product-card';
import { useTranslation, useLocaleStore } from '@/store/locale-store';

// ─── BANNER CAROUSEL ────────────────────────────────
function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const { locale } = useLocaleStore();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // swipe left → next
        setCurrent((p) => (p + 1) % banners.length);
      } else {
        // swipe right → prev
        setCurrent((p) => (p - 1 + banners.length) % banners.length);
      }
    }
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="relative aspect-[2.2/1]"
        >
          {banners[current].imageUrl ? (
            <Image
              src={banners[current].imageUrl}
              alt={banners[current].titleUz || ''}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {locale === 'ru' && banners[current].titleRu ? banners[current].titleRu : banners[current].titleUz}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          {(banners[current].titleUz || banners[current].titleRu) && (
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
              <h2 className="text-white font-bold text-sm sm:text-xl mb-0.5 line-clamp-1">
                {locale === 'ru' && banners[current].titleRu ? banners[current].titleRu : banners[current].titleUz}
              </h2>
              {(banners[current].subtitleUz || banners[current].subtitleRu) && (
                <p className="text-white/80 text-xs line-clamp-1">
                  {locale === 'ru' && banners[current].subtitleRu ? banners[current].subtitleRu : banners[current].subtitleUz}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {banners.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/50 w-1'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FILTER CHIPS ────────────────────────────────
function FilterChips({ selected, onSelect }: { selected: string; onSelect: (f: string) => void }) {
  const { t } = useTranslation();

  const filters = [
    { key: 'forYou', label: t('forYou') },
    { key: 'wowPrice', label: t('wowPrice') },
    { key: 'discounts', label: t('discounts') },
    { key: 'electronics', label: t('electronics') },
    { key: 'clothing', label: t('clothing') },
  ];

  return (
    <div className="overflow-x-auto no-scrollbar border-b border-gray-100">
      <div className="inline-flex items-center gap-4">
        {filters.map((f) => {
          const isActive = selected === f.key;
          return (
            <button
              key={f.key}
              onClick={() => onSelect(f.key)}
              className={`relative whitespace-nowrap pb-2 text-sm transition-all ${
                isActive
                  ? 'text-black font-semibold border-b-2 border-black'
                  : 'text-gray-400 font-normal hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SKELETON ────────────────────────────────
function HomeSkeleton() {
  return (
    <div className="site-container space-y-4 pt-1 animate-pulse">
      <div className="h-36 sm:h-48 skeleton rounded-xl" />
      <div className="flex gap-4 w-fit">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-5 w-16 skeleton rounded" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <div className="aspect-square skeleton" />
            <div className="p-2 space-y-1.5">
              <div className="h-3 skeleton rounded w-3/4" />
              <div className="h-4 skeleton rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────
export default function HomePage() {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState('forYou');

  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: () => shopApi.getBanners(),
  });

  // Determine product query params based on selected filter
  const getProductParams = (): Record<string, string> => {
    switch (selectedFilter) {
      case 'wowPrice':
        return { sortBy: 'price_asc', limit: '20', maxPrice: '100000' };
      case 'discounts':
        return { sortBy: 'popular', limit: '20', hasDiscount: 'true' };
      case 'electronics':
        return { sortBy: 'popular', limit: '20', category: 'elektronika' };
      case 'clothing':
        return { sortBy: 'popular', limit: '20', category: 'kiyim' };
      default: // forYou
        return { sortBy: 'popular', limit: '20' };
    }
  };

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['home-products', selectedFilter],
    queryFn: () => shopApi.getProducts(getProductParams()),
  });

  const products = productsData?.products ?? [];

  if (isLoading && !productsData) return <HomeSkeleton />;

  return (
    <div className="space-y-1.5 pb-8">
      {/* Banner */}
      <section className="site-container">
        <BannerCarousel banners={banners} />
      </section>

      {/* Filter Chips */}
      <section className="site-container">
        <FilterChips selected={selectedFilter} onSelect={setSelectedFilter} />
      </section>

      {/* Products */}
      <section className="site-container">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square skeleton" />
                <div className="p-2 space-y-1.5">
                  <div className="h-3 skeleton rounded w-3/4" />
                  <div className="h-4 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <ProductGrid products={products} columns={4} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">{t('noResults')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
