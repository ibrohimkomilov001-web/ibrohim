 import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ShopDetailClient from '../shops/[id]/shop-detail-client';
import type { ShopDetail } from '@/lib/api/shop';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Reserved slugs — bu route conflict bo'lmasligi uchun
const RESERVED_SLUGS = new Set([
  'about', 'addresses', 'cart', 'categories', 'checkout',
  'favorites', 'help', 'orders', 'payments', 'products',
  'profile', 'reviews', 'search', 'shops',
]);

/**
 * Slug bo'yicha do'kon olish — SSR uchun
 */
async function getShopBySlug(slug: string): Promise<ShopDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/shops/by-slug/${encodeURIComponent(slug)}`, {
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
 * Dynamic SEO metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(slug)) {
    return { title: 'Topla.uz' };
  }

  const shop = await getShopBySlug(slug);
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
      url: `https://topla.uz/${slug}`,
    },
    twitter: {
      card: 'summary',
      title: shop.name,
      description,
    },
    alternates: {
      canonical: `https://topla.uz/${slug}`,
    },
  };
}

/**
 * SSR Shop Page by Slug — topla.uz/shopslug
 */
export default async function ShopBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Reserved slug bo'lsa, 404
  if (RESERVED_SLUGS.has(slug)) {
    notFound();
  }

  const shop = await getShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  return <ShopDetailClient shopId={shop.id} initialShop={shop} />;
}
