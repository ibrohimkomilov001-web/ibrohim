import type { Metadata } from 'next'
import TermsContent from './terms-content'

export const metadata: Metadata = {
  title: 'Foydalanish shartlari / Условия использования - TOPLA',
  description: 'TOPLA ilovasining foydalanish shartlari va qoidalari',
}

export default function TermsOfServicePage() {
  return <TermsContent />
}
