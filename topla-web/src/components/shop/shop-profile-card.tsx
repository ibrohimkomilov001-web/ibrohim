'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, MessageCircle, Heart } from 'lucide-react';
import { resolveImageUrl } from '@/lib/api/upload';
import { useTranslation } from '@/store/locale-store';

interface ShopProfileCardProps {
  shop: {
    id: string;
    name: string;
    logoUrl?: string | null;
    shopType?: string;
    rating?: number;
    reviewCount?: number;
    totalSales?: number;
    createdAt?: string;
    _count?: { products?: number; followers?: number; orderItems?: number };
  };
  compact?: boolean;
}

export function ShopProfileCard({ shop, compact = false }: ShopProfileCardProps) {
  const { locale } = useTranslation();

  function formatCount(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  }

  function getTimeOnMarket(createdAt?: string) {
    if (!createdAt) return null;
    const diffDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    if (years >= 1) return `${years} ${locale === 'ru' ? 'лет' : 'yil'}`;
    const months = Math.floor(diffDays / 30);
    return `${months > 0 ? months : 1} ${locale === 'ru' ? 'мес.' : 'oy'}`;
  }

  const shopType = shop.shopType || (locale === 'ru' ? 'Магазин' : 'Do\'kon');
  const followersCount = shop._count?.followers ?? 0;
  const ordersCount = shop._count?.orderItems ?? shop.totalSales ?? 0;
  const timeStr = getTimeOnMarket(shop.createdAt);

  return (
    <Link href={`/shops/${shop.id}`} className="block">
      <div className="bg-card rounded-2xl p-4 border border-border/50 hover:shadow-md transition-shadow">
        {/* Row 1: Logo + Name/Type + Icons */}
        <div className="flex items-center gap-3">
          {/* Rounded square logo */}
          <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/50">
            {shop.logoUrl ? (
              <Image src={resolveImageUrl(shop.logoUrl)} alt="" width={48} height={48} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {shop.name?.charAt(0)?.toUpperCase() || '🏪'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{shop.name}</h3>
            <p className="text-xs text-muted-foreground">{shopType}</p>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <span className="p-1.5 rounded-full hover:bg-muted"><MessageCircle className="w-5 h-5 text-muted-foreground" /></span>
            <span className="p-1.5 rounded-full hover:bg-muted"><Heart className="w-5 h-5 text-muted-foreground" /></span>
          </div>
        </div>

        {/* Row 2: Stats */}
        {!compact && (
          <div className="grid grid-cols-4 gap-1 mt-3 pt-3 border-t border-border/30">
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold">{shop.rating?.toFixed(1) || '—'}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {formatCount(shop.reviewCount ?? 0)} {locale === 'ru' ? 'оценок' : 'baho'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">{formatCount(ordersCount)}</p>
              <p className="text-[10px] text-muted-foreground">{locale === 'ru' ? 'заказов' : 'buyurtma'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">{formatCount(followersCount)}</p>
              <p className="text-[10px] text-muted-foreground">{locale === 'ru' ? 'подпис.' : 'obunachi'}</p>
            </div>
            {timeStr && (
              <div className="text-center">
                <p className="text-sm font-bold">{timeStr.split(' ')[0]}</p>
                <p className="text-[10px] text-muted-foreground">{timeStr.split(' ').slice(1).join(' ')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
