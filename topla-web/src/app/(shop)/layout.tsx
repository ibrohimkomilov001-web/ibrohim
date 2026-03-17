'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const NO_FOOTER_PAGES = ['/profile', '/cart'];
const NO_HEADER_PAGES = ['/profile'];

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = !NO_HEADER_PAGES.some((p) => pathname.startsWith(p));
  const showFooter = !NO_FOOTER_PAGES.some((p) => pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {showHeader && <Header />}

      {/* Main content */}
      <main id="main-content" className="relative z-10 flex-1">
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}
