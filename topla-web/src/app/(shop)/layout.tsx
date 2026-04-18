'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const NO_FOOTER_PAGES = ['/profile', '/cart'];
const NO_HEADER_PAGES = ['/profile'];
const MOBILE_NO_HEADER_PAGES = ['/search'];

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = !NO_HEADER_PAGES.some((p) => pathname.startsWith(p));
  const mobileHideHeader = MOBILE_NO_HEADER_PAGES.some((p) => pathname.startsWith(p));
  const showFooter = !NO_FOOTER_PAGES.some((p) => pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && <Header className={mobileHideHeader ? 'hidden sm:block' : ''} />}

      {/* Main content */}
      <main id="main-content" className="relative flex-1">
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}
