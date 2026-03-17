/**
 * utils.ts formatlash funksiyalari testlari
 * Testlar: formatNumber, formatPrice, formatDate, formatDateLong, formatDateTime, formatTime, cn
 */
import { describe, it, expect } from 'vitest';
import {
  cn,
  formatNumber,
  formatPrice,
  formatDate,
  formatDateLong,
  formatDateTime,
  formatTime,
} from '@/lib/utils';

// ============================================
// cn() — className birlashtiruvchi
// ============================================
describe('cn()', () => {
  it('bitta klassni qaytarishi kerak', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  it('bir nechta klassni birlashtirishi kerak', () => {
    const result = cn('p-4', 'text-lg', 'font-bold');
    expect(result).toContain('p-4');
    expect(result).toContain('text-lg');
    expect(result).toContain('font-bold');
  });

  it('shartli klasslarni to\'g\'ri ishlashi kerak', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toContain('active');
  });

  it('false/undefined/null klasslarni filtrlab tashlashi kerak', () => {
    const result = cn('base', false, undefined, null, 'end');
    expect(result).toContain('base');
    expect(result).toContain('end');
    expect(result).not.toContain('false');
    expect(result).not.toContain('undefined');
  });

  it('Tailwind ziddiyatlarini hal qilishi kerak (twMerge)', () => {
    // p-4 va p-2 ziddiyati — oxirgisi g'olib bo'lishi kerak
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('bo\'sh kirishda bo\'sh string qaytarishi kerak', () => {
    expect(cn()).toBe('');
  });
});

// ============================================
// formatNumber() — raqam formatlash
// ============================================
describe('formatNumber()', () => {
  it('kichik raqamni o\'zgartirmasligi kerak', () => {
    expect(formatNumber(123)).toBe('123');
  });

  it('ming lik ajratuvchini qo\'shishi kerak', () => {
    expect(formatNumber(1234)).toBe('1 234');
  });

  it('million lik raqamni to\'g\'ri formatlashi kerak', () => {
    expect(formatNumber(1234567)).toBe('1 234 567');
  });

  it('0 ni to\'g\'ri ishlashi kerak', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('manfiy raqamlarni ishlashi kerak', () => {
    const result = formatNumber(-50000);
    expect(result).toContain('50 000');
  });
});

// ============================================
// formatPrice() — narx formatlash
// ============================================
describe('formatPrice()', () => {
  it('oddiy narxni formatlashi kerak', () => {
    expect(formatPrice(150000)).toBe("150 000 so'm");
  });

  it('katta narxni formatlashi kerak', () => {
    expect(formatPrice(1500000)).toBe("1 500 000 so'm");
  });

  it('0 narxni formatlashi kerak', () => {
    expect(formatPrice(0)).toBe("0 so'm");
  });

  it('kasr qismni yaxlitlashi kerak', () => {
    expect(formatPrice(99999.7)).toBe("100 000 so'm");
    expect(formatPrice(99999.3)).toBe("99 999 so'm");
  });
});

// ============================================
// formatDate() — sana formatlash (qisqa)
// ============================================
describe('formatDate()', () => {
  it('Date obyektini formatlashi kerak', () => {
    const date = new Date(2026, 1, 12); // 12 fevral 2026
    expect(formatDate(date)).toBe('12 fev, 2026');
  });

  it('ISO string ni formatlashi kerak', () => {
    const result = formatDate('2026-03-15T10:30:00Z');
    expect(result).toContain('mar');
    expect(result).toContain('2026');
  });

  it('yil boshini to\'g\'ri formatlashi kerak', () => {
    const date = new Date(2026, 0, 1); // 1 yanvar
    expect(formatDate(date)).toBe('1 yan, 2026');
  });

  it('yil oxirini to\'g\'ri formatlashi kerak', () => {
    const date = new Date(2026, 11, 31); // 31 dekabr
    expect(formatDate(date)).toBe('31 dek, 2026');
  });
});

// ============================================
// formatDateLong() — sana formatlash (uzun)
// ============================================
describe('formatDateLong()', () => {
  it('to\'liq oy nomini yozishi kerak', () => {
    const date = new Date(2026, 1, 12);
    expect(formatDateLong(date)).toBe('12 fevral 2026');
  });

  it('barcha oylar uchun to\'g\'ri nom', () => {
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
    ];
    months.forEach((name, index) => {
      const date = new Date(2026, index, 15);
      expect(formatDateLong(date)).toContain(name);
    });
  });
});

// ============================================
// formatDateTime() — sana + vaqt
// ============================================
describe('formatDateTime()', () => {
  it('sana va vaqtni birga formatlashi kerak', () => {
    const date = new Date(2026, 1, 12, 15, 30);
    expect(formatDateTime(date)).toBe('12 fev, 2026 15:30');
  });

  it('soat va daqiqani 2 xonali qilishi kerak', () => {
    const date = new Date(2026, 0, 5, 9, 5);
    expect(formatDateTime(date)).toContain('09:05');
  });

  it('yarim tunda to\'g\'ri ko\'rsatishi kerak', () => {
    const date = new Date(2026, 5, 1, 0, 0);
    expect(formatDateTime(date)).toContain('00:00');
  });
});

// ============================================
// formatTime() — faqat vaqt
// ============================================
describe('formatTime()', () => {
  it('vaqtni HH:MM formatida qaytarishi kerak', () => {
    const date = new Date(2026, 0, 1, 14, 45);
    expect(formatTime(date)).toBe('14:45');
  });

  it('ertalab vaqtni to\'g\'ri formatlashi kerak', () => {
    const date = new Date(2026, 0, 1, 8, 5);
    expect(formatTime(date)).toBe('08:05');
  });

  it('yarim tunda 00:00 bo\'lishi kerak', () => {
    const date = new Date(2026, 0, 1, 0, 0);
    expect(formatTime(date)).toBe('00:00');
  });

  it('23:59 ni to\'g\'ri ko\'rsatishi kerak', () => {
    const date = new Date(2026, 0, 1, 23, 59);
    expect(formatTime(date)).toBe('23:59');
  });
});
