'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatPrice } from '@/lib/utils';
import { resolveImageUrl } from '@/lib/api/upload';
import { useFavoritesStore } from '@/store/favorites-store';
import { useLocaleStore } from '@/store/locale-store';
import type { ProductItem } from '@/lib/api/shop';

interface ProductCardProps {
  product: ProductItem;
  index?: number;
  variant?: 'grid' | 'horizontal' | 'compact';
  className?: string;
}

export function ProductCard({ product, index = 0, variant = 'grid', className }: ProductCardProps) {
  const { locale } = useLocaleStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isFav = isFavorite(product.id);
  const [currentImg, setCurrentImg] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);
  const imgCount = product.images?.length || 0;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    if (Math.abs(touchStartX.current - e.touches[0].clientX) > 10) {
      isSwiping.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    e.preventDefault();
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 30) {
      if (diff > 0 && currentImg < imgCount - 1) setCurrentImg(p => p + 1);
      else if (diff < 0 && currentImg > 0) setCurrentImg(p => p - 1);
    }
  }, [currentImg, imgCount]);

  const name = locale === 'ru' && product.nameRu ? product.nameRu : product.nameUz;
  const oldPrice = product.compareAtPrice || product.originalPrice;
  const hasDiscount = oldPrice && oldPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((oldPrice! - product.price) / oldPrice!) * 100)
    : 0;

  if (variant === 'horizontal') {
    return (
      <Link href={`/products/${product.id}`} className={cn('product-card flex gap-3 p-3', className)}>
        <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden">
          {product.images?.[0] ? (
            <Image src={resolveImageUrl(product.images[0])} alt={name} fill className="object-cover" sizes="112px" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-2xl">📦</div>
          )}
          {discountPercent > 0 && (
            <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <p className="text-sm font-medium line-clamp-2 leading-snug mb-1">{name}</p>
          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-3.5 h-3.5 rating-star fill-current" />
            <span className="text-xs text-muted-foreground">{product.rating?.toFixed(1) || '0.0'}</span>
            {product.salesCount > 0 && (
              <span className="text-xs text-muted-foreground">• {product.salesCount}</span>
            )}
          </div>
          <div className="flex items-end gap-2">
            <span className="font-bold text-base text-foreground">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(oldPrice!)}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className={className}>
      <div className="product-card block overflow-hidden group">
        {/* Image with swipe carousel */}
        <div
          className="relative aspect-square"
          onTouchStart={imgCount > 1 ? handleTouchStart : undefined}
          onTouchMove={imgCount > 1 ? handleTouchMove : undefined}
          onTouchEnd={imgCount > 1 ? handleTouchEnd : undefined}
        >
          <Link href={`/products/${product.id}`} className="block w-full h-full">
            {product.images?.[currentImg] ? (
              <Image
                src={resolveImageUrl(product.images[currentImg])}
                alt={name}
                fill
                className="object-cover transition-opacity duration-200"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">📦</div>
            )}
          </Link>

          {/* Image dots */}
          {imgCount > 1 && (
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {product.images.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-1 h-1 rounded-full transition-all',
                    i === currentImg ? 'bg-white w-2' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          )}

          {/* Discount badge */}
          {discountPercent > 0 && <div className="discount-badge">-{discountPercent}%</div>}

          {/* Flash sale */}
          {product.flashSalePrice && (
            <div className="absolute bottom-1.5 left-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-2">
              <Zap className="w-2.5 h-2.5" /> Flash
            </div>
          )}

          {/* Favorite button */}
          <button
            aria-label={isFav ? 'Sevimlilardan olib tashlash' : "Sevimlilarga qo'shish"}
            className={cn(
              'absolute top-2 right-2 w-8 h-8 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 transition-all',
              'sm:opacity-0 sm:group-hover:opacity-100'
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
          >
            <Heart
              className={cn(
                'w-4 h-4 transition-colors',
                isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
              )}
            />
          </button>
        </div>

        {/* Content */}
        <Link href={`/products/${product.id}`} className="block p-2.5 sm:p-3">
          <p className="text-xs sm:text-sm font-medium leading-snug mb-1 text-foreground min-h-[2.5em] line-clamp-1">
            {name}
          </p>

          <div className="flex items-center gap-1 mb-1">
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {product.rating?.toFixed(1) || '0.0'}
            </span>
            {product.salesCount > 0 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                • {product.salesCount}
              </span>
            )}
          </div>

          <div className="flex items-end gap-1.5">
            <span className="font-bold text-sm sm:text-base text-foreground">{formatPrice(product.price)}</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Product grid with responsive columns
interface ProductGridProps {
  products: ProductItem[];
  columns?: 2 | 3 | 4 | 5;
}

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-3 sm:gap-4', colClasses[columns])}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
