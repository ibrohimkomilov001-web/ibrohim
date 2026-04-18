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
  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const b = banners[current];
    if (!b || viewedRef.current.has(b.id)) return;
    viewedRef.current.add(b.id);
    shopApi.trackBannerView(b.id);
  }, [current, banners]);

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
        setCurrent((p) => (p + 1) % banners.length);
      } else {
        setCurrent((p) => (p - 1 + banners.length) % banners.length);
      }
    }
  }, [banners.length]);

  if (!banners.length) return null;

  const b = banners[current];
  const title = locale === 'ru' && b.titleRu ? b.titleRu : b.titleUz;
  const subtitle = locale === 'ru' && b.subtitleRu ? b.subtitleRu : b.subtitleUz;
  const ctaLabel = locale === 'ru' && b.ctaTextRu ? b.ctaTextRu : b.ctaText;
  const textPos = b.textPosition || 'left';
  const alignClass =
    textPos === 'center' ? 'items-center text-center'
    : textPos === 'right' ? 'items-end text-right'
    : 'items-start text-left';

  const href = (() => {
    if (!b.actionType || b.actionType === 'none' || !b.actionValue) return null;
    if (b.actionType === 'link') return b.actionValue;
    if (b.actionType === 'product') return `/product/${b.actionValue}`;
    if (b.actionType === 'category') return `/category/${b.actionValue}`;
    if (b.actionType === 'shop') return `/shop/${b.actionValue}`;
    return null;
  })();

  const handleClick = () => { shopApi.trackBannerClick(b.id); };

  const innerStyle: React.CSSProperties = {};
  if (b.bgColor) innerStyle.background = b.bgColor;

  const slide = (
    <motion.div
      key={current}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative aspect-[2.2/1]"
      style={innerStyle}
    >
      {b.imageUrl ? (
        <Image
          src={b.imageUrl}
          alt={title || ''}
          fill
          className="object-cover"
          priority
          unoptimized
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
          <span className="text-white text-xl font-bold">{title}</span>
        </div>
      )}
      {(title || subtitle || ctaLabel) && (
        <>
          {!b.bgColor && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          )}
          <div className={`absolute inset-0 p-3 sm:p-5 flex flex-col justify-end ${alignClass}`}>
            {title && (
              <h2 className="font-bold text-sm sm:text-xl mb-0.5 line-clamp-1" style={{ color: b.textColor || '#fff' }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs line-clamp-1 opacity-80" style={{ color: b.textColor || '#fff' }}>
                {subtitle}
              </p>
            )}
            {ctaLabel && href && (
              <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full bg-white/90 text-foreground text-xs font-semibold shadow self-start">
                {ctaLabel}
              </span>
            )}
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <div
      className="relative overflow-hidden rounded-xl touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        {href ? (
          <Link key={current} href={href} onClick={handleClick} className="block">
            {slide}
          </Link>
        ) : (
          slide
        )}
      </AnimatePresence>

      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 drop-shadow ${
                i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
              }`}
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
    <div className="overflow-x-auto no-scrollbar border-b border-border">
      <div className="inline-flex items-center gap-1">
        {filters.map((f) => {
          const isActive = selected === f.key;
          return (
            <button
              key={f.key}
              onClick={() => onSelect(f.key)}
              className={`relative whitespace-nowrap px-3 pb-1 text-sm transition-all ${
                isActive
                  ? 'text-foreground font-semibold border-b-2 border-foreground -mb-px'
                  : 'text-muted-foreground font-normal hover:text-foreground'
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
    <div className="space-y-3 pb-8">
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
            <p className="text-muted-foreground text-sm">{t('noResults')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
