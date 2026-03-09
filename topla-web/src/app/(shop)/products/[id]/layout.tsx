import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/products/${id}`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { title: 'Mahsulot topilmadi' };
    const json = await res.json();
    const product = json.data ?? json;

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
  } catch {
    return { title: 'Mahsulot' };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
