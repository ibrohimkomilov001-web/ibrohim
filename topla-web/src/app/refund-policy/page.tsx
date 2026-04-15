import type { Metadata } from 'next'
import RefundContent from './refund-content'

export const metadata: Metadata = {
  title: 'Qaytarish siyosati / Политика возврата - TOPLA',
  description: 'TOPLA platformasida tovarlarni qaytarish va mablag\'larni qaytarish siyosati',
}

export default function RefundPolicyPage() {
  return <RefundContent />
}
