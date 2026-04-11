import type { Metadata } from 'next';
import { headers } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz';

// Do'kon ma'lumotlarini olish (Next.js fetch deduplicate qiladi)
async function getShop(id: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/shops/${id}`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shop = await getShop(id);

  if (!shop) return { title: "Do'kon topilmadi" };

  const title = shop.name || "Do'kon";
  const description =
    shop.description?.slice(0, 160) ||
    `${title} — TOPLA.UZ dagi do'kon. Mahsulotlarni ko'ring va xarid qiling!`;
  const image = shop.logoUrl
    ? shop.logoUrl.startsWith('http')
      ? shop.logoUrl
      : `${new URL(API_BASE).origin}${shop.logoUrl}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | TOPLA.UZ`,
      description,
      url: `${SITE_URL}/shops/${id}`,
      type: 'website',
      ...(image && { images: [{ url: image, width: 400, height: 400, alt: title }] }),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shop = await getShop(id);

  // JSON-LD: LocalBusiness structured data (Google Maps, Rich Snippets)
  const jsonLd = shop
    ? {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: shop.name,
        description: shop.description || '',
        url: `${SITE_URL}/shops/${id}`,
        ...(shop.logoUrl && {
          image: shop.logoUrl.startsWith('http')
            ? shop.logoUrl
            : `${new URL(API_BASE).origin}${shop.logoUrl}`,
        }),
        ...(shop.address && {
          address: {
            '@type': 'PostalAddress',
            streetAddress: shop.address,
            addressCountry: 'UZ',
          },
        }),
        ...(shop.phone && { telephone: shop.phone }),
        ...(shop.rating > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: shop.rating,
                reviewCount: shop.reviewCount || 1,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
        priceRange: '$$',
        currenciesAccepted: 'UZS',
      }
    : null;

  const nonce = headers().get('x-nonce') ?? '';

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
