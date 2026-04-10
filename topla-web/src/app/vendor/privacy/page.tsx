import type { Metadata } from 'next'
import VendorPrivacyContent from './vendor-privacy-content'

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati / Политика конфиденциальности — TOPLA',
  description:
    'Topla.uz platformasida sotuvchilarning shaxsiy ma\'lumotlarini himoya qilish siyosati',
}

export default function VendorPrivacyPage() {
  return <VendorPrivacyContent />
}
