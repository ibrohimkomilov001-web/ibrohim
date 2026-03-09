import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/vendor/', '/pickup/', '/api/', '/profile/', '/cart/', '/checkout/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
