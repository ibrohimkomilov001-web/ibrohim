import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sotuvchi kabinetiga kirish',
  description:
    "TOPLA.UZ vendor paneliga kirish. Do'koningizni boshqaring, mahsulotlar qo'shing, buyurtmalarni kuzating va statistikani ko'ring.",
  alternates: { canonical: '/vendor/login' },
  openGraph: {
    title: 'TOPLA.UZ — Sotuvchi kabinetiga kirish',
    description:
      "TOPLA.UZ vendor paneliga kirish. Do'koningizni boshqaring, mahsulotlar qo'shing, buyurtmalarni kuzating.",
  },
}

export default function VendorLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
