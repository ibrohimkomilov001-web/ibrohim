'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  { code: 'uz' as const, Flag: UzFlag },
  { code: 'ru' as const, Flag: RuFlag },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore()
  const current = languages.find(l => l.code === locale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
          aria-label={`Til: ${locale}`}
        >
          <current.Flag className="w-6 h-4 rounded-sm shadow-sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-0">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={`justify-center px-3 py-1.5 ${locale === lang.code ? 'bg-gray-100' : ''}`}
          >
            <lang.Flag className="w-7 h-5 rounded-sm shadow-sm" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
