import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "TOPLA FAQ — Ko'p so'raladigan savollar",
  description:
    "TOPLA.UZ platformasi haqida ko'p so'raladigan savollar va javoblar — buyurtma berish, yetkazib berish, to'lov, qaytarish, hisob xavfsizligi, sotuvchilar va boshqalar.",
  alternates: { canonical: '/faq' },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
