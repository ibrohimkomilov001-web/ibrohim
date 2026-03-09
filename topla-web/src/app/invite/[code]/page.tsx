import type { Metadata } from 'next'
import Link from 'next/link'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  return {
    title: `TOPLA - Do'stingiz sizni taklif qildi!`,
    description: `TOPLA ilovasini ${code} taklif kodi bilan yuklab oling va bonusga ega bo'ling!`,
    openGraph: {
      title: `TOPLA - Do'stingiz sizni taklif qildi!`,
      description: `TOPLA ilovasini yuklab oling va maxsus bonuslarga ega bo'ling! Taklif kodi: ${code}`,
      type: 'website',
      url: `https://topla.uz/invite/${code}`,
    },
  }
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FF6D00 0%, #FF8F00 50%, #FFA726 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px 32px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #FF6D00, #FF8F00)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '36px',
          fontWeight: 700,
          color: 'white',
          letterSpacing: '-1px',
        }}>
          T
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#1F2937',
          margin: '0 0 8px',
          lineHeight: 1.3,
        }}>
          Do&apos;stingiz sizni TOPLA&apos;ga taklif qildi!
        </h1>

        <p style={{
          fontSize: '15px',
          color: '#6B7280',
          margin: '0 0 28px',
          lineHeight: 1.5,
        }}>
          Ilovani yuklab oling va taklif kodini kiritib, maxsus bonuslarga ega bo&apos;ling
        </p>

        {/* Referral Code */}
        <div style={{
          background: '#FFF7ED',
          border: '2px dashed #FB923C',
          borderRadius: '14px',
          padding: '16px',
          margin: '0 0 28px',
        }}>
          <div style={{
            fontSize: '12px',
            color: '#9CA3AF',
            fontWeight: 500,
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Taklif kodi
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#EA580C',
            letterSpacing: '3px',
            fontFamily: 'monospace',
          }}>
            {code}
          </div>
        </div>

        {/* Steps */}
        <div style={{
          textAlign: 'left',
          margin: '0 0 28px',
          padding: '0 8px',
        }}>
          {[
            { num: '1', text: 'TOPLA ilovasini yuklab oling' },
            { num: '2', text: "Ro'yxatdan o'ting" },
            { num: '3', text: `"${code}" kodini kiriting` },
            { num: '4', text: 'Bonus ballaringizdan foydalaning!' },
          ].map((step) => (
            <div key={step.num} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#FFF7ED',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {step.num}
              </div>
              <span style={{ fontSize: '14px', color: '#374151' }}>
                {step.text}
              </span>
            </div>
          ))}
        </div>

        {/* Download Button */}
        <a
          href="https://play.google.com/store/apps/details?id=uz.topla.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            background: 'linear-gradient(135deg, #FF6D00, #FF8F00)',
            color: 'white',
            padding: '14px 24px',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            textDecoration: 'none',
            marginBottom: '12px',
          }}
        >
          📲 Ilovani yuklab olish
        </a>

        <Link
          href="/"
          style={{
            display: 'inline-block',
            fontSize: '14px',
            color: '#9CA3AF',
            textDecoration: 'none',
            marginTop: '8px',
          }}
        >
          topla.uz saytiga o&apos;tish →
        </Link>
      </div>
    </div>
  )
}
