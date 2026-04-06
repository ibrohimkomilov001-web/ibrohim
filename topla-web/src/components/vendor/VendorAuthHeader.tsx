'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export type MenuItem = {
  label: string;
  href: string;
  external?: boolean;
};

interface VendorAuthHeaderProps {
  menuItems?: MenuItem[];
}

export function VendorAuthHeader({ menuItems = [] }: VendorAuthHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border-b border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
        : 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-md shadow-sm border-b border-white/20 dark:border-gray-800/20'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center">
            <span className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white">
              TOPLA<span className="text-[#2563EB]">.UZ</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Menu"
              >
                <span className={`block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 rounded transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
                <span className={`block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 rounded mt-1 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 rounded mt-1 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </button>

              {menuOpen && menuItems.length > 0 && (
                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  {menuItems.map((item) =>
                    item.external ? (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#2563EB] transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#2563EB] transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
