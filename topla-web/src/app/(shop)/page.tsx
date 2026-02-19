'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight, ChevronLeft, Star, Search,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { shopApi, type Banner, type Category, type ProductItem } from '@/lib/api/shop';
import { formatPrice } from '@/lib/utils';
import { ProductCard, ProductGrid as ProductGridComponent } from '@/components/shop/product-card';
import { useTranslation, useLocaleStore } from '@/store/locale-store';
import { useRouter } from 'next/navigation';

// ============ BANNER CAROUSEL ============
function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const { locale } = useLocaleStore();

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="relative aspect-[2/1] sm:aspect-[2.5/1]"
        >
          {banners[current].imageUrl && (
            <Image
              src={banners[current].imageUrl}
              alt={banners[current].titleUz || ''}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {(banners[current].titleUz || banners[current].titleRu) && (
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <h2 className="text-white font-bold text-lg sm:text-2xl mb-0.5">
                {locale === 'ru' && banners[current].titleRu ? banners[current].titleRu : banners[current].titleUz}
              </h2>
              {(banners[current].subtitleUz || banners[current].subtitleRu) && (
                <p className="text-white/80 text-sm">
                  {locale === 'ru' && banners[current].subtitleRu ? banners[current].subtitleRu : banners[current].subtitleUz}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((p) => (p - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setCurrent((p) => (p + 1) % banners.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============ CATEGORY SCROLL (horizontal like app) ============
function CategoryScroll({ categories }: { categories: Category[] }) {
  const { locale } = useLocaleStore();

  if (!categories.length) return null;

  // Inline icon mapping with emojis for category grid
  const emojiMap: Record<string, string> = {
    mobile: '📱', monitor: '💻', blend_2: '🏠', screenmirroring: '📺',
    shirt: '👕', bag_2: '👜', diamonds: '💎', magic_star: '✨',
    drop: '🧴', brush_1: '🪥', lamp_charge: '🛋️', home_2: '🏡',
    building_4: '🔧', box_1: '🧪', happyemoji: '👶', game: '🧸',
    pen_tool: '✏️', milk: '🥛', cake: '🍰', cup: '☕',
    car: '🚗', weight_1: '🏋️', driver: '🎮', book: '📚',
    colorfilter: '🎨', pet: '🐾', lovely: '🌸', gift: '🎁',
  };

  return (
    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
      <div className="flex gap-3 sm:gap-4 pb-1">
        {categories.slice(0, 10).map((cat, i) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.id}`}
            className="flex flex-col items-center gap-1.5 min-w-[64px] group"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center text-2xl group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all group-active:scale-95"
            >
              {emojiMap[cat.icon || ''] || '📦'}
            </motion.div>
            <span className="text-[11px] text-center font-medium leading-tight line-clamp-2 w-16 text-gray-600 group-hover:text-primary transition-colors">
              {locale === 'ru' && cat.nameRu ? cat.nameRu : cat.nameUz}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============ FILTER CHIPS (like app) ============
type FilterType = 'all' | 'wow' | 'discount' | 'electronics' | 'clothing';

function FilterChips({
  active,
  onChange,
}: {
  active: FilterType;
  onChange: (f: FilterType) => void;
}) {
  const { t } = useTranslation();

  const chips: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('forYou') },
    { key: 'wow', label: t('wowPrice') },
    { key: 'discount', label: t('discounts') },
    { key: 'electronics', label: t('electronics') },
    { key: 'clothing', label: t('clothing') },
  ];

  return (
    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
      <div className="flex gap-2 pb-1">
        {chips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => onChange(chip.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
              active === chip.key
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-white/60 backdrop-blur-sm border border-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ SKELETON ============
function HomeSkeleton() {
  return (
    <div className="site-container space-y-6 pt-3 animate-pulse">
      <div className="h-44 sm:h-56 skeleton rounded-2xl" />
      <div className="flex gap-3 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 min-w-[64px]">
            <div className="w-14 h-14 skeleton rounded-2xl" />
            <div className="w-12 h-3 skeleton rounded" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-24 skeleton rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <div className="aspect-square skeleton" />
            <div className="p-3 space-y-2">
              <div className="h-4 skeleton rounded w-3/4" />
              <div className="h-5 skeleton rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ HOME PAGE ============
export default function HomePage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: () => shopApi.getBanners(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => shopApi.getCategories(),
  });

  // Fetch products based on filter
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['home-products', filter],
    queryFn: () => {
      switch (filter) {
        case 'wow':
          return shopApi.getProducts({ sortBy: 'priceAsc', limit: '20', maxPrice: '100000' });
        case 'discount':
          return shopApi.getProducts({ sortBy: 'popular', limit: '20', hasDiscount: 'true' });
        case 'electronics': {
          const elCat = categories.find(c => c.nameUz === 'Elektronika');
          return shopApi.getProducts({ sortBy: 'popular', limit: '20', ...(elCat?.id ? { categoryId: elCat.id } : {}) });
        }
        case 'clothing': {
          const clothCat = categories.find(c => c.nameUz === 'Kiyim va poyabzal');
          return shopApi.getProducts({ sortBy: 'popular', limit: '20', ...(clothCat?.id ? { categoryId: clothCat.id } : {}) });
        }
        default:
          return shopApi.getProducts({ sortBy: 'popular', limit: '20' });
      }
    },
    enabled: filter !== 'electronics' && filter !== 'clothing' || categories.length > 0,
  });

  const products = productsData?.products ?? [];

  if (isLoading && !productsData) return <HomeSkeleton />;

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      {/* Banner Carousel */}
      <section className="site-container pt-2">
        <BannerCarousel banners={banners} />
      </section>

      {/* Categories — horizontal scroll */}
      <section className="site-container">
        <CategoryScroll categories={categories} />
      </section>

      {/* Filter Chips */}
      <section className="site-container">
        <FilterChips active={filter} onChange={setFilter} />
      </section>

      {/* Products Grid */}
      <section className="site-container">
        {products.length > 0 ? (
          <ProductGridComponent products={products} columns={5} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">{t('noResults')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
