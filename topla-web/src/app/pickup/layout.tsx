import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Olib ketish punkti ochish — Pickup Point',
  description:
    "TOPLA.UZ platformasida olib ketish punkti (pickup point) oching. Buyurtmalarni qabul qiling, qo'shimcha daromad oling. Toshkent va viloyatlarda hamkorlik imkoniyati.",
  alternates: { canonical: '/pickup' },
  openGraph: {
    title: 'TOPLA.UZ — Olib ketish punkti ochish imkoniyati',
    description:
      "TOPLA.UZ platformasida olib ketish punkti oching. Buyurtmalarni qabul qiling va qo'shimcha daromad oling.",
  },
}

export default function PickupLayout({ children }: { children: React.ReactNode }) {
  return children
}
