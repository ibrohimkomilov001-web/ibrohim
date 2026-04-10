import type { Metadata } from 'next'
import VendorTermsContent from './vendor-terms-content'

export const metadata: Metadata = {
  title: 'Oferta shartnomasi / Договор оферты — TOPLA',
  description: 'Topla.uz platformasida sotuvchi sifatida ishlash uchun oferta shartnomasi shartlari',
}

export default function VendorTermsPage() {
  return <VendorTermsContent />
}
