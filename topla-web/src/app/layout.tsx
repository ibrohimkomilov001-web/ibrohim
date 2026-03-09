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
  themeColor: '#7c3aed',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              forcedTheme="light"
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
