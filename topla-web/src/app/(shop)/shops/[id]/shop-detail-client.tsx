'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, Phone, ExternalLink, Package, Truck, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { shopApi, type ShopDetail } from '@/lib/api/shop';
import { resolveImageUrl } from '@/lib/api/upload';
import { formatPrice } from '@/lib/utils';
import { ProductGrid } from '@/components/shop/product-card';
import { useTranslation } from '@/store/locale-store';

interface ShopDetailClientProps {
  shopId: string;
  initialShop: ShopDetail | null;
}

export default function ShopDetailClient({ shopId, initialShop }: ShopDetailClientProps) {
  const id = shopId;
  const { t, locale } = useTranslation();

  const { data: shop, isLoading } = useQuery({
    queryKey: ['shop', id],
    queryFn: () => shopApi.getShop(id),
    enabled: !!id,
    initialData: initialShop ?? undefined,
  });

  const { data: productsData } = useQuery({
    queryKey: ['shop-products', id],
    queryFn: () => shopApi.getShopProducts(id, { limit: '40' }),
    enabled: !!id,
  });

  const products = productsData?.products ?? [];

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 sm:h-64 skeleton" />
        <div className="site-container -mt-16 space-y-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 skeleton rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-6 skeleton rounded w-1/3" />
                <div className="h-4 skeleton rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="site-container text-center py-20">
        <p className="text-5xl mb-4">🏪</p>
        <p className="text-lg font-medium">{locale === 'ru' ? 'Магазин не найден' : 'Do\'kon topilmadi'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 sm:h-64 lg:h-72">
        {shop.bannerUrl ? (
          <Image src={resolveImageUrl(shop.bannerUrl)} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="site-container">
        {/* Shop info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 sm:p-6 -mt-16 relative z-10"
        >
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-card shadow-lg overflow-hidden shrink-0 -mt-12 border-4 border-background ring-2 ring-border/50">
              {shop.logoUrl ? (
                <Image src={resolveImageUrl(shop.logoUrl)} alt="" width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-3xl">🏪</div>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">{shop.name}</h1>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Star className="w-4 h-4 rating-star fill-current" />
                      <span className="font-medium text-foreground">{shop.rating?.toFixed(1) || '0.0'}</span>
                      {shop.reviewCount > 0 && <span>({shop.reviewCount})</span>}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      shop.isOpen
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                      {shop.isOpen ? t('openShop') : t('closedShop')}
                    </span>
                  </div>
                </div>
              </div>

              {shop.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{shop.description}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-3">
                {shop.address && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" /> {shop.address}
                  </span>
                )}
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Phone className="w-4 h-4 shrink-0" /> {shop.phone}
                  </a>
                )}
                {shop.website && (
                  <a href={shop.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {locale === 'ru' ? 'Сайт' : 'Sayt'}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <Package className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="font-bold text-lg sm:text-xl">{shop._count?.products || 0}</p>
              <p className="text-xs text-muted-foreground">{t('shopProducts')}</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <Truck className="w-5 h-5 mx-auto text-blue-500 mb-1" />
              <p className="font-bold text-lg sm:text-xl">
                {shop.deliveryFee ? formatPrice(shop.deliveryFee) : t('free')}
              </p>
              <p className="text-xs text-muted-foreground">{t('deliveryFee')}</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <ShoppingCart className="w-5 h-5 mx-auto text-green-500 mb-1" />
              <p className="font-bold text-lg sm:text-xl">
                {shop.minOrderAmount ? formatPrice(shop.minOrderAmount) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">{t('minOrder')}</p>
            </div>
          </div>
        </motion.div>

        {/* Products section */}
        <div className="py-8 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">
              {locale === 'ru' ? 'Товары' : 'Mahsulotlar'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {products.length} {t('shopProducts')}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-muted-foreground">
                {locale === 'ru' ? 'Пока нет товаров' : 'Hozircha mahsulot yo\'q'}
              </p>
            </div>
          ) : (
            <ProductGrid products={products} columns={5} />
          )}
        </div>
      </div>
    </div>
  );
}
