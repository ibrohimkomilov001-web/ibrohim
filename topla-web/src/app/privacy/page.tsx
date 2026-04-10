import type { Metadata } from 'next'
import PrivacyContent from './privacy-content'

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati / Политика конфиденциальности - TOPLA',
  description: "TOPLA ilovasining maxfiylik siyosati va shaxsiy ma'lumotlar himoyasi",
}

export default function PrivacyPolicyPage() {
  return <PrivacyContent />
}