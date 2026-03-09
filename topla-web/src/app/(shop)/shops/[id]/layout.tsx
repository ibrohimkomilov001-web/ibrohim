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
    const res = await fetch(`${API_BASE}/shops/${id}`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { title: "Do'kon topilmadi" };
    const json = await res.json();
    const shop = json.data ?? json;

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
  } catch {
    return { title: "Do'kon" };
  }
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
