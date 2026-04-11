import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish — TOPLA.UZ Vendor",
  description:
    "TOPLA.UZ platformasida sotuvchi sifatida ro'yxatdan o'ting. Hujjatlaringizni yuklang, 1-2 ish kunida tekshiruv o'tkaziladi va do'koningiz faollashtiriladi.",
  alternates: { canonical: '/vendor/register' },
  openGraph: {
    title: "TOPLA.UZ — Sotuvchi ro'yxatdan o'tish",
    description:
      "TOPLA.UZ platformasida sotuvchi sifatida ro'yxatdan o'ting va o'z do'koningizni oching.",
  },
}

export default function VendorRegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
