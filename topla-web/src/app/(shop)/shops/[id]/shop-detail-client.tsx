'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, ExternalLink, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { shopApi, type ShopDetail } from '@/lib/api/shop';
import { resolveImageUrl } from '@/lib/api/upload';
import { ProductGrid } from '@/components/shop/product-card';
import { useTranslation } from '@/store/locale-store';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { ShopFollowButton } from '@/components/shop/shop-follow-button';

interface ShopDetailClientProps {
  shopId: string;
  initialShop: ShopDetail | null;
}

export default function ShopDetailClient({ shopId, initialShop }: ShopDetailClientProps) {
  const id = shopId;
  const { t, locale } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [followersDelta, setFollowersDelta] = useState(0);

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

  function formatCount(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  }

  function getTimeOnMarket(createdAt?: string) {
    if (!createdAt) return { value: '—', suffix: '' };
    const created = new Date(createdAt);
    const diffDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    if (years >= 1) return { value: years.toString(), suffix: locale === 'ru' ? 'лет на Topla' : 'yil Topla\'da' };
    const months = Math.floor(diffDays / 30);
    return { value: months > 0 ? months.toString() : '1', suffix: locale === 'ru' ? 'мес. на Topla' : 'oy Topla\'da' };
  }

  const shopType = (shop as any)?.shopType || (locale === 'ru' ? 'Магазин' : 'Do\'kon');
  const followersCount = shop?._count?.followers ?? 0;
  const ordersCount = shop?._count?.orderItems ?? shop?.totalSales ?? 0;
  const timeOnMarket = getTimeOnMarket(shop?.createdAt);

  if (isLoading) {
    return (
      <div className="animate-pulse site-container py-8">
        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 skeleton rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-6 skeleton rounded w-1/3" />
              <div className="h-4 skeleton rounded w-1/4" />
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 skeleton rounded-full" />
              <div className="w-10 h-10 skeleton rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <div className="h-6 skeleton rounded w-12 mx-auto" />
                <div className="h-3 skeleton rounded w-16 mx-auto" />
              </div>
            ))}
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
      <div className="relative h-36 sm:h-48 lg:h-56">
        {shop.bannerUrl && !bannerError ? (
          <Image src={resolveImageUrl(shop.bannerUrl)} alt="" fill className="object-cover" unoptimized onError={() => setBannerError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="site-container">
        {/* Shop Profile Card — Yandex Market Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 sm:p-6 -mt-12 relative z-10 shadow-sm border border-border/50"
        >
          {/* Row 1: Logo + Name/Type + Icons */}
          <div className="flex items-center gap-4">
            {/* Rounded square logo */}
            <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-muted overflow-hidden shrink-0 border border-border/50">
              {shop.logoUrl && !logoError ? (
                <Image src={resolveImageUrl(shop.logoUrl)} alt="" width={72} height={72} className="object-cover w-full h-full" onError={() => setLogoError(true)} />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {shop.name?.charAt(0)?.toUpperCase() || '🏪'}
                </div>
              )}
            </div>

            {/* Name + Type */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{shop.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{shopType}</p>
            </div>

            {/* Chat + Heart icons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  if (!isAuthenticated) { router.push('/profile'); return; }
                  router.push(`/shops/${id}/chat`);
                }}
                className="p-2.5 rounded-full hover:bg-muted transition-colors"
                title={t('askSeller')}
              >
                <MessageCircle className="w-6 h-6 text-muted-foreground" />
              </button>
              <ShopFollowButton
                shopId={id}
                variant="icon"
                onFollowChange={(following) => setFollowersDelta(prev => following ? prev + 1 : prev - 1)}
              />
            </div>
          </div>

          {/* Row 2: Stats bar */}
          <div className="grid grid-cols-4 gap-2 mt-5 pt-5 border-t border-border/50">
            {/* Rating */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-lg font-extrabold">{shop.rating?.toFixed(1) || '—'}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCount(shop.reviewCount)} {locale === 'ru' ? 'оценок' : 'baho'}
              </p>
            </div>

            {/* Orders */}
            <div className="text-center">
              <p className="text-lg font-extrabold">{formatCount(ordersCount)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {locale === 'ru' ? 'заказов' : 'buyurtma'}
              </p>
            </div>

            {/* Subscribers */}
            <div className="text-center">
              <p className="text-lg font-extrabold">{formatCount(followersCount + followersDelta)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {locale === 'ru' ? 'подписчиков' : 'obunachi'}
              </p>
            </div>

            {/* Time on market */}
            <div className="text-center">
              <p className="text-lg font-extrabold">{timeOnMarket.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeOnMarket.suffix}</p>
            </div>
          </div>

          {/* Description & contact info */}
          {(shop.description || shop.address || shop.website) && (
            <div className="mt-5 pt-4 border-t border-border/50">
              {shop.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{shop.description}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-2">
                {shop.address && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" /> {shop.address}
                  </span>
                )}
                {shop.website && (
                  <a href={shop.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {locale === 'ru' ? 'Сайт' : 'Sayt'}
                  </a>
                )}
              </div>
            </div>
          )}
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
