'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Phone, ArrowRight, Loader2, ShieldCheck, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { userAuthApi } from '@/lib/api/user-auth';
import { useTranslation } from '@/store/locale-store';

type Step = 'phone' | 'otp';

export function OtpLogin() {
  const { t, locale } = useTranslation();
  const { login, isLoading } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatPhone = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Format: +998 XX XXX XX XX
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 9) {
      setPhone(digits);
      setError('');
    }
  };

  const handleSendOtp = async () => {
    if (phone.length < 9) {
      setError(locale === 'ru' ? 'Введите номер телефона' : 'Telefon raqamni kiriting');
      return;
    }

    setOtpSending(true);
    setError('');
    try {
      await userAuthApi.sendOtp(`+998${phone}`, 'sms');
      setStep('otp');
      setCountdown(60);
      // Focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || (locale === 'ru' ? 'Ошибка отправки кода' : 'Kod yuborishda xatolik'));
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 4) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    const fullCode = newOtp.join('');
    if (fullCode.length === 5) {
      handleVerifyOtp(fullCode);
    }
  }, [otp]);

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (pasted.length === 5) {
      handleVerifyOtp(pasted);
    } else {
      otpRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerifyOtp = async (code: string) => {
    const result = await login(`+998${phone}`, code);
    if (!result.success) {
      setError(result.error || (locale === 'ru' ? 'Неверный код' : 'Noto\'g\'ri kod'));
      setOtp(['', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setOtpSending(true);
    try {
      await userAuthApi.sendOtp(`+998${phone}`, 'sms');
      setCountdown(60);
      setOtp(['', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setOtpSending(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">
          {locale === 'ru' ? 'Войти в TOPLA' : 'TOPLA ga kirish'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {step === 'phone'
            ? (locale === 'ru'
                ? 'Введите номер телефона для входа'
                : 'Telefon raqamingizni kiriting')
            : (locale === 'ru'
                ? `Код отправлен на +998 ${formatPhone(phone)}`
                : `Kod +998 ${formatPhone(phone)} raqamiga yuborildi`)}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">
                {locale === 'ru' ? 'Номер телефона' : 'Telefon raqam'}
              </label>
              <div className="flex items-center search-glass rounded-xl overflow-hidden">
                <span className="px-3 text-sm text-muted-foreground font-medium border-r border-border">
                  +998
                </span>
                <input
                  type="tel"
                  value={formatPhone(phone)}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  className="flex-1 px-3 py-3.5 text-sm bg-transparent outline-none"
                  placeholder="90 123 45 67"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive mb-3">{error}</p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={otpSending || phone.length < 9}
              className="liquid-btn w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {otpSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {locale === 'ru' ? 'Получить код' : 'Kodni olish'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* OTP inputs */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-4" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl search-glass outline-none transition-all ${
                    digit ? 'ring-2 ring-primary' : ''
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-destructive mb-3 text-center">{error}</p>
            )}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 mb-3 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {locale === 'ru' ? 'Проверка...' : 'Tekshirilmoqda...'}
              </div>
            )}

            {/* Resend / Back */}
            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => { setStep('phone'); setOtp(['', '', '', '', '']); setError(''); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← {locale === 'ru' ? 'Изменить номер' : 'Raqamni o\'zgartirish'}
              </button>
              <button
                onClick={handleResendOtp}
                disabled={countdown > 0 || otpSending}
                className="text-sm flex items-center gap-1 disabled:text-muted-foreground text-primary hover:text-primary/80 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {countdown > 0
                  ? `${countdown}s`
                  : (locale === 'ru' ? 'Отправить снова' : 'Qayta yuborish')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-5 pt-4 border-t border-border">
        <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
        {locale === 'ru'
          ? 'Ваши данные защищены и не передаются третьим лицам'
          : 'Ma\'lumotlaringiz himoyalangan va uchinchi shaxslarga berilmaydi'}
      </div>
    </div>
  );
}
