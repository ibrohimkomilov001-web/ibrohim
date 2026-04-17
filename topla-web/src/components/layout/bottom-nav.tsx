'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useTranslation } from '@/store/locale-store';

function ProfileSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="6.5" r="3.5"/>
      <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8H4z"/>
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const cartCount = useCartStore((s) => s.getItemCount());

  const items = [
    { href: '/', icon: Home, label: t('home'), exact: true },
    { href: '/search', icon: Search, label: t('search'), exact: false },
    { href: '/cart', icon: ShoppingCart, label: t('cart'), exact: true, badge: cartCount },
    { href: '/profile', icon: ProfileSvg, label: t('profile'), exact: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                isActive ? 'text-primary' : 'text-foreground'
              )}
            >
              <div className="relative">
                <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
