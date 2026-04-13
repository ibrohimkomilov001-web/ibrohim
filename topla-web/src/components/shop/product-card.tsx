'use client';

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
      <Link href={`/products/${product.id}`} className="product-card block overflow-hidden group">
        {/* Image */}
        <div className="relative aspect-square">
          {product.images?.[0] ? (
            <Image
              src={resolveImageUrl(product.images[0])}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-3xl">📦</div>
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
              'absolute top-2 right-2 w-9 h-9 sm:w-7 sm:h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 transition-all',
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
                'w-3.5 h-3.5 transition-colors',
                isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'
              )}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-2.5">
          <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-snug mb-1 text-gray-800">
            {name}
          </p>

          <div className="flex items-center gap-1 mb-1">
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-[10px] sm:text-xs text-gray-400">
              {product.rating?.toFixed(1) || '0.0'}
            </span>
            {product.salesCount > 0 && (
              <span className="text-[10px] sm:text-xs text-gray-400">
                • {product.salesCount}
              </span>
            )}
          </div>

          <div className="flex items-end gap-1.5">
            <span className="font-bold text-sm sm:text-base text-gray-900">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                {formatPrice(oldPrice!)}
              </span>
            )}
          </div>
        </div>
      </Link>
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
    <div className={cn('grid gap-2 sm:gap-3', colClasses[columns])}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
