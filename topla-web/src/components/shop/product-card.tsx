'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatPrice } from '@/lib/utils';
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
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  if (variant === 'horizontal') {
    return (
      <Link href={`/products/${product.id}`} className={cn('product-card flex gap-3 p-3', className)}>
        <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden">
          {product.images?.[0] ? (
            <Image src={product.images[0]} alt={name} fill className="object-cover" sizes="112px" />
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
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compareAtPrice!)}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      <Link href={`/products/${product.id}`} className="product-card block overflow-hidden group">
        {/* Image */}
        <div className="relative aspect-square img-zoom">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">📦</div>
          )}

          {/* Discount badge */}
          {discountPercent > 0 && <div className="discount-badge">-{discountPercent}%</div>}

          {/* Flash sale */}
          {product.flashSalePrice && (
            <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 z-2">
              <Zap className="w-3 h-3" /> Flash Sale
            </div>
          )}

          {/* Favorite button */}
          <button
            className={cn(
              'absolute top-2.5 right-2.5 w-8 h-8 rounded-full glass flex items-center justify-center z-10 transition-all',
              'opacity-0 group-hover:opacity-100 sm:opacity-100'
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
        <div className="p-3">
          <p className="text-sm font-medium line-clamp-2 leading-snug mb-1.5 group-hover:text-primary transition-colors">
            {name}
          </p>

          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-3.5 h-3.5 rating-star fill-current" />
            <span className="text-xs text-muted-foreground">
              {product.rating?.toFixed(1) || '0.0'}
            </span>
            {product.salesCount > 0 && (
              <span className="text-xs text-muted-foreground">
                • {product.salesCount} {locale === 'ru' ? 'продано' : 'sotildi'}
              </span>
            )}
          </div>

          <div className="flex items-end gap-2">
            <span className="font-bold text-base">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>

          {product.shop && (
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {product.shop.name}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
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
