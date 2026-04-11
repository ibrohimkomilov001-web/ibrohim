import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Sotuvchi bo'lish — TOPLA.UZ Vendor",
  description:
    "TOPLA.UZ platformasida do'kon oching va O'zbekiston bo'ylab minglab xaridorlarga mahsulotlaringizni soting. Komissiya 5-15%, tezkor yetkazish, qulay panel.",
  alternates: { canonical: '/vendor/become-seller' },
  openGraph: {
    title: "TOPLA.UZ da sotuvchi bo'ling — O'z do'koningizni oching",
    description:
      "TOPLA.UZ platformasida do'kon oching va O'zbekiston bo'ylab minglab xaridorlarga mahsulotlaringizni soting.",
  },
}

export default function BecomeSellerlayout({ children }: { children: React.ReactNode }) {
  return children
}
