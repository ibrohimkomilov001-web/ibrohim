import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ShopDetailClient from './shop-detail-client';
import type { ShopDetail } from '@/lib/api/shop';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz';

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
  const shopUrl = `${SITE_URL}/shops/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: shopUrl,
      languages: {
        uz: shopUrl,
        ru: shopUrl,
      },
    },
    openGraph: {
      title: shop.name,
      description,
      images: shop.logoUrl ? [{ url: shop.logoUrl }] : [],
      type: 'website',
      siteName: 'Topla.uz',
      url: shopUrl,
    },
    twitter: {
      card: 'summary',
      title: shop.name,
      description,
      images: shop.logoUrl ? [shop.logoUrl] : [],
    },
  };
}

function buildShopJsonLd(shop: ShopDetail, id: string) {
  const shopUrl = `${SITE_URL}/shops/${id}`;
  const sameAs: string[] = [];
  if (shop.website) sameAs.push(shop.website);
  if (shop.instagram) {
    sameAs.push(
      shop.instagram.startsWith('http')
        ? shop.instagram
        : `https://instagram.com/${shop.instagram.replace(/^@/, '')}`,
    );
  }
  if (shop.telegram) {
    sameAs.push(
      shop.telegram.startsWith('http')
        ? shop.telegram
        : `https://t.me/${shop.telegram.replace(/^@/, '')}`,
    );
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: shop.name,
    description: shop.description || shop.name,
    url: shopUrl,
    image: shop.logoUrl || undefined,
    logo: shop.logoUrl || undefined,
    telephone: shop.phone || undefined,
    address: shop.address
      ? { '@type': 'PostalAddress', streetAddress: shop.address, addressCountry: 'UZ' }
      : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    ...(shop.rating > 0 &&
      shop.reviewCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: shop.rating,
          reviewCount: shop.reviewCount,
          bestRating: 5,
        },
      }),
  };
}

function buildBreadcrumbJsonLd(shop: ShopDetail, id: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Bosh sahifa', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: "Do'konlar", item: `${SITE_URL}/shops` },
      {
        '@type': 'ListItem',
        position: 3,
        name: shop.name,
        item: `${SITE_URL}/shops/${id}`,
      },
    ],
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

  const nonce = headers().get('x-nonce') ?? '';

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildShopJsonLd(shop, id)) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(shop, id)) }}
      />
      <ShopDetailClient shopId={id} initialShop={shop} />
    </>
  );
}