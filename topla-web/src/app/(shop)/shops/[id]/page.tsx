import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ShopDetailClient from './shop-detail-client';
import type { ShopDetail } from '@/lib/api/shop';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Server-side do'kon olish — SSR uchun (SEO + tez yuklash)
 */
async function getShop(id: string): Promise<ShopDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/shops/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as ShopDetail;
  } catch {
    return null;
  }
}

/**
 * Dynamic SEO metadata — Google botlar uchun server-da generatsiya qilinadi
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shop = await getShop(id);
  if (!shop) {
    return { title: "Do'kon topilmadi — Topla.uz" };
  }

  const title = `${shop.name} — Topla.uz`;
  const description =
    shop.description?.slice(0, 160) ||
    `${shop.name} — Topla.uz onlayn marketplace. Mahsulotlar va narxlar.`;

  return {
    title,
    description,
    openGraph: {
      title: shop.name,
      description,
      images: shop.logoUrl ? [{ url: shop.logoUrl }] : [],
      type: 'website',
      siteName: 'Topla.uz',
    },
    twitter: {
      card: 'summary',
      title: shop.name,
      description,
    },
  };
}

/**
 * SSR Shop Page — server component
 * Do'kon ma'lumotlari serverda olib, client componentga uzatiladi.
 * Bu Google bot uchun to'liq HTML beradi (SEO).
 */
export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shop = await getShop(id);

  if (!shop) {
    notFound();
  }

  return <ShopDetailClient shopId={id} initialShop={shop} />;
}