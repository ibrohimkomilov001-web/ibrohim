'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * global-error.tsx — Root layout ichida yuz bergan xatolarni ushlaydi.
 * Bu fayl o'zining <html> va <body> teglarini taqdim etishi SHART,
 * chunki root layout xato bilan buzilgan bo'lishi mumkin.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Xatolikni Sentry'ga yuborish
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="uz">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '28px',
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
              Kutilmagan xatolik
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
              Ilova yuklashda jiddiy xatolik yuz berdi. Sahifani yangilang yoki bosh sahifaga qayting.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Qayta urinish
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Bosh sahifa
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
