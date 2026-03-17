import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz';

// Mahsulot ma'lumotlarini olish (Next.js fetch deduplicate qiladi)
async function getProduct(id: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/products/${id}`, {
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
  const product = await getProduct(id);

  if (!product) return { title: 'Mahsulot topilmadi' };

  const title = product.nameUz || product.name || 'Mahsulot';
  const description =
    product.descriptionUz?.slice(0, 160) ||
    `${title} — ${product.price?.toLocaleString()} so'm. TOPLA.UZ da xarid qiling!`;
  const image = product.images?.[0]
    ? product.images[0].startsWith('http')
      ? product.images[0]
      : `${new URL(API_BASE).origin}${product.images[0]}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | TOPLA.UZ`,
      description,
      url: `${SITE_URL}/products/${id}`,
      type: 'website',
      ...(image && { images: [{ url: image, width: 800, height: 800, alt: title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  // JSON-LD: Product structured data (Google Rich Snippets)
  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.nameUz || product.name,
        description: product.descriptionUz || product.descriptionRu || '',
        image: product.images || [],
        sku: product.id,
        url: `${SITE_URL}/products/${id}`,
        brand: product.brand?.name
          ? { '@type': 'Brand', name: product.brand.name }
          : undefined,
        offers: {
          '@type': 'Offer',
          url: `${SITE_URL}/products/${id}`,
          priceCurrency: 'UZS',
          price: product.price,
          ...(product.originalPrice && product.originalPrice > product.price
            ? { priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] }
            : {}),
          availability:
            product.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: product.shop?.name
            ? { '@type': 'Organization', name: product.shop.name }
            : undefined,
        },
        ...(product.rating > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.reviewCount || 1,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
