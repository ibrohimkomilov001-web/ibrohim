import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-register";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: '#FF8800',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz'),
  title: {
    default: "TOPLA.UZ - O'zbekistonning eng yirik marketplace",
    template: '%s | TOPLA.UZ',
  },
  description: "TOPLA.UZ - online savdo platformasi. Minglab do'konlar, millionlab mahsulotlar. Eng arzon narxlarda xarid qiling!",
  keywords: ['topla', 'marketplace', 'online savdo', "o'zbekiston", 'dokon', 'mahsulot', 'xarid'],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: 'TOPLA.UZ',
    title: "TOPLA.UZ - O'zbekistonning eng yirik marketplace",
    description: "Minglab do'konlar, millionlab mahsulotlar. Eng arzon narxlarda xarid qiling!",
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: "TOPLA.UZ - O'zbekistonning eng yirik marketplace",
    description: "Minglab do'konlar, millionlab mahsulotlar.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TOPLA',
  },
  formatDetection: {
    telephone: false,
  },
};

// JSON-LD: Organization + WebSite structured data (SEO)
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TOPLA.UZ',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz'}/icon-512.png`,
  description: "O'zbekistonning eng yirik online marketplace platformasi",
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['uz', 'ru'],
  },
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TOPLA.UZ',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://topla.uz'}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        {/* Accessibility: asosiy kontentga o'tish havolasi */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Asosiy kontentga o&apos;tish
        </a>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster position="top-right" richColors />
              <ServiceWorkerRegistration />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
