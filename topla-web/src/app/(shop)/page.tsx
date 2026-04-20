'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { motion, useMotionValue, animate, type PanInfo } from 'framer-motion';
import { shopApi, type Banner, type Category } from '@/lib/api/shop';
import { ProductCard, ProductGrid } from '@/components/shop/product-card';
import { useTranslation, useLocaleStore } from '@/store/locale-store';

// ─── BANNER SLIDE ────────────────────────────────
function BannerSlide({ b, locale }: { b: Banner; locale: string }) {
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

  const innerStyle: React.CSSProperties = {};
  if (b.bgColor) innerStyle.background = b.bgColor;

  const content = (
    <div className="relative aspect-[2.2/1] w-full select-none" style={innerStyle}>
      {b.imageUrl ? (
        <Image
          src={b.imageUrl}
          alt={title || ''}
          fill
          sizes="100vw"
          className="object-cover pointer-events-none"
          priority
          unoptimized
          draggable={false}
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
          <div className={`absolute inset-0 p-3 sm:p-5 flex flex-col justify-end pointer-events-none ${alignClass}`}>
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
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={() => shopApi.trackBannerClick(b.id)}
        className="block w-full"
        draggable={false}
      >
        {content}
      </Link>
    );
  }
  return content;
}

// ─── BANNER CAROUSEL (Yandex-style peek + drag) ────────────────────────────────
function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const { locale } = useLocaleStore();
  const viewedRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const x = useMotionValue(0);

  // Peek config: each slide is 88% of container, with gap 8px between slides.
  const SLIDE_RATIO = 0.88;
  const GAP = 8;

  // Measure container and compute slide width.
  useEffect(() => {
    const measure = () => {
      const w = containerRef.current?.offsetWidth || 0;
      setSlideWidth(Math.round(w * SLIDE_RATIO));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Step = slide width + gap between slides.
  const step = slideWidth + GAP;
  // Center offset so active slide is centered with equal peek on both sides.
  const centerOffset = slideWidth > 0 && containerRef.current
    ? (containerRef.current.offsetWidth - slideWidth) / 2
    : 0;

  // Animate to current slide when `current` changes or dimensions change.
  useEffect(() => {
    if (slideWidth === 0) return;
    const target = -current * step + centerOffset;
    const controls = animate(x, target, {
      type: 'spring',
      stiffness: 300,
      damping: 32,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, slideWidth]);

  // Auto-rotate.
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Track view.
  useEffect(() => {
    const b = banners[current];
    if (!b || viewedRef.current.has(b.id)) return;
    viewedRef.current.add(b.id);
    shopApi.trackBannerView(b.id);
  }, [current, banners]);

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (slideWidth === 0) return;
      const threshold = slideWidth * 0.2;
      const { offset, velocity } = info;
      if (offset.x < -threshold || velocity.x < -400) {
        setCurrent((p) => Math.min(p + 1, banners.length - 1));
      } else if (offset.x > threshold || velocity.x > 400) {
        setCurrent((p) => Math.max(p - 1, 0));
      } else {
        // Snap back to current.
        animate(x, -current * step + centerOffset, {
          type: 'spring',
          stiffness: 300,
          damping: 32,
        });
      }
    },
    [banners.length, slideWidth, step, centerOffset, current, x]
  );

  if (!banners.length) return null;

  // Drag bounds: track can go from 0 (first centered) to -(N-1)*step + centerOffset.
  const dragLeftBound = -(banners.length - 1) * step + centerOffset;
  const dragRightBound = centerOffset;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden touch-pan-y"
    >
      <motion.div
        className="flex items-stretch"
        style={{ x, gap: `${GAP}px` }}
        drag={banners.length > 1 ? 'x' : false}
        dragConstraints={{ left: dragLeftBound, right: dragRightBound }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {banners.map((b) => (
          <div
            key={b.id}
            className="shrink-0 overflow-hidden rounded-xl"
            style={{ width: slideWidth || '88%' }}
          >
            <BannerSlide b={b} locale={locale} />
          </div>
        ))}
      </motion.div>
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
    <div
      className="overflow-x-auto overflow-y-hidden no-scrollbar border-b border-border"
      style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex items-stretch gap-1 -ml-1 w-max">
        {filters.map((f) => {
          const isActive = selected === f.key;
          return (
            <button
              key={f.key}
              onClick={() => onSelect(f.key)}
              className={`relative shrink-0 whitespace-nowrap px-3 pb-1.5 pt-1 text-sm transition-colors ${
                isActive
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground font-normal hover:text-foreground'
              }`}
            >
              {f.label}
              {isActive && (
                <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-foreground rounded-full" />
              )}
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
