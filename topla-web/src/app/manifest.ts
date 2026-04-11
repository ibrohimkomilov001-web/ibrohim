import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'TOPLA.UZ — Marketplace',
    short_name: 'TOPLA',
    description: "O'zbekistonning eng yirik online savdo platformasi",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FF8800',
    orientation: 'portrait-primary',
    categories: ['shopping', 'business'],
    lang: 'uz',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
