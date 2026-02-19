'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Header />

      {/* Main content */}
      <main className="relative z-10 flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}
