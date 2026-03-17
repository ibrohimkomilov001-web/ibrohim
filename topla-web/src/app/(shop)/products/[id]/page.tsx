import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './product-detail-client';
import type { ProductDetail } from '@/lib/api/shop';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

  return {
    title,
    description,
    openGraph: {
      title: product.nameUz,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      type: 'website',
      siteName: 'Topla.uz',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.nameUz,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
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

  return <ProductDetailClient productId={id} initialProduct={product} />;
}