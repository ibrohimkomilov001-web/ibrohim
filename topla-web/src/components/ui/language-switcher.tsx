'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocaleStore } from '@/store/locale-store'

function UzFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#1EB53A" />
      <rect width="30" height="7" fill="#0099B5" />
      <rect y="7" width="30" height="1" fill="#CE1126" />
      <rect width="30" height="6" y="8" fill="#fff" />
      <rect y="14" width="30" height="1" fill="#CE1126" />
      <circle cx="9" cy="3.5" r="2.2" fill="#fff" />
      <circle cx="10" cy="3.5" r="1.8" fill="#0099B5" />
      {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        return <circle key={i} cx={13 + col * 1.8} cy={1.5 + row * 1.8} r="0.5" fill="#fff" />;
      })}
    </svg>
  );
}

function RuFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" rx="1" fill="#fff" />
      <rect y="7" width="30" height="7" fill="#0039A6" />
      <rect y="14" width="30" height="6" fill="#D52B1E" />
      <rect width="30" height="20" rx="1" fill="none" stroke="#d1d5db" strokeWidth="0.8" />
    </svg>
  );
}

const languages = [
  { code: 'uz' as const, Flag: UzFlag, label: "O'zbekcha" },
  { code: 'ru' as const, Flag: RuFlag, label: 'Русский' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = languages.find(l => l.code === locale) || languages[0]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
        aria-label={`Til: ${locale}`}
      >
        <current.Flag className="w-6 h-4 rounded-sm shadow-sm" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden min-w-[160px]"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLocale(lang.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors ${
                  locale === lang.code
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <lang.Flag className="w-7 h-5 rounded-sm shadow-sm shrink-0" />
                <span>{lang.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
