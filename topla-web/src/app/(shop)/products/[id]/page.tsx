import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ProductDetailClient from './product-detail-client';
import type { ProductDetail } from '@/lib/api/shop';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz';

/**
 * Server-side mahsulot olish — SSR uchun (SEO + tez yuklash)
 */
async function getProduct(id: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as ProductDetail;
  } catch {
    return null;
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
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
  const product = await getProduct(id);
  if (!product) {
    return { title: 'Mahsulot topilmadi — Topla.uz' };
  }

  const title = `${product.nameUz} — Topla.uz`;
  const description =
    product.descriptionUz?.slice(0, 160) ||
    `${product.nameUz} — ${formatPrice(product.price)}. Topla.uz onlayn do'konida xarid qiling.`;
  const productUrl = `${SITE_URL}/products/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
      languages: {
        'uz': productUrl,
        'ru': productUrl,
      },
    },
    openGraph: {
      title: product.nameUz,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      type: 'website',
      siteName: 'Topla.uz',
      url: productUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.nameUz,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

function buildProductJsonLd(product: ProductDetail, id: string) {
  const productUrl = `${SITE_URL}/products/${id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameUz,
    description: product.descriptionUz || product.nameUz,
    image: product.images || [],
    url: productUrl,
    sku: product.sku || id,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'UZS',
      price: product.price,
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: product.shop ? {
        '@type': 'Organization',
        name: product.shop.name,
      } : undefined,
    },
    ...(product.rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        bestRating: 5,
      },
    }),
    ...(product.category && {
      category: product.category.nameUz,
    }),
  };
}

function buildBreadcrumbJsonLd(product: ProductDetail, id: string) {
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Bosh sahifa', item: SITE_URL },
  ];
  if (product.category?.parent) {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: product.category.parent.nameUz,
      item: `${SITE_URL}/categories/${product.category.parent.id}`,
    });
  }
  if (product.category) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: product.category.nameUz,
      item: `${SITE_URL}/categories/${product.category.id}`,
    });
  }
  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: product.nameUz,
    item: `${SITE_URL}/products/${id}`,
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * SSR Product Page — server component
 * Mahsulot ma'lumotlari serverda olib, client componentga uzatiladi.
 * Bu Google bot uchun to'liq HTML beradi (SEO).
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const nonce = headers().get('x-nonce') ?? '';

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductJsonLd(product, id)) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(product, id)) }}
      />
      <ProductDetailClient productId={id} initialProduct={product} />
    </>
  );
}