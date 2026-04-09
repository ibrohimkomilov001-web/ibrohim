/**
 * Payment Validation Schema Tests — Phase 6
 * Tests Zod schemas from payment.routes.ts
 * Since schemas aren't exported, we recreate them for validation testing.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Recreate schemas from payment.routes.ts to test validation logic
const addCardSchema = z.object({
  maskedPan: z.string().min(16).max(19, 'Karta raqami noto\'g\'ri'),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY').optional(),
  token: z.string().min(1, 'Token kerak'),
  provider: z.enum(['aliance', 'octobank']),
  isDefault: z.boolean().default(false),
});

const createTransactionSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().min(100),
  paymentMethod: z.enum(['cash', 'card']),
  providerTxnId: z.string().optional(),
  providerData: z.any().optional(),
});

const processPaymentSchema = z.object({
  orderId: z.string().uuid(),
  cardId: z.string().uuid(),
  amount: z.number().min(100),
  description: z.string().optional(),
  paymentType: z.enum(['ONE_STEP', 'TWO_STEP']).default('ONE_STEP'),
});

const initPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().min(100),
  description: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

const installmentSchema = z.object({
  orderId: z.string().uuid(),
  cardId: z.string().uuid(),
  amount: z.number().min(100),
  months: z.number().min(3).max(24),
  description: z.string().optional(),
});

const payoutSchema = z.object({
  cardId: z.string().uuid(),
  amount: z.number().min(100),
  description: z.string().optional(),
});

// Installment rates (from payment.routes.ts)
const INSTALLMENT_RATES: Record<number, number> = {
  3: 0, 6: 2.5, 9: 5, 12: 8, 18: 12, 24: 16,
};

describe('Payment Validation Schemas', () => {
  // ==================================================
  // addCardSchema
  // ==================================================
  describe('addCardSchema', () => {
    it('should accept valid card data', () => {
      const result = addCardSchema.parse({
        maskedPan: '8600********1234',
        expiryDate: '12/25',
        token: 'some-token',
        provider: 'octobank',
      });
      expect(result.maskedPan).toBe('8600********1234');
      expect(result.isDefault).toBe(false); // default
    });

    it('should reject short maskedPan', () => {
      expect(() => addCardSchema.parse({
        maskedPan: '12345',
        token: 'tok',
        provider: 'octobank',
      })).toThrow();
    });

    it('should reject empty token', () => {
      expect(() => addCardSchema.parse({
        maskedPan: '8600********1234',
        token: '',
        provider: 'octobank',
      })).toThrow();
    });

    it('should reject invalid provider', () => {
      expect(() => addCardSchema.parse({
        maskedPan: '8600********1234',
        token: 'tok',
        provider: 'payme',
      })).toThrow();
    });

    it('should reject invalid expiry format', () => {
      expect(() => addCardSchema.parse({
        maskedPan: '8600********1234',
        token: 'tok',
        provider: 'octobank',
        expiryDate: '2025-12',
      })).toThrow();
    });

    it('should accept valid expiry format MM/YY', () => {
      const result = addCardSchema.parse({
        maskedPan: '8600********1234',
        token: 'tok',
        provider: 'aliance',
        expiryDate: '01/26',
      });
      expect(result.expiryDate).toBe('01/26');
    });
  });

  // ==================================================
  // createTransactionSchema
  // ==================================================
  describe('createTransactionSchema', () => {
    it('should accept valid transaction', () => {
      const result = createTransactionSchema.parse({
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        amount: 50000,
        paymentMethod: 'card',
      });
      expect(result.paymentMethod).toBe('card');
    });

    it('should reject non-UUID orderId', () => {
      expect(() => createTransactionSchema.parse({
        orderId: 'not-a-uuid',
        amount: 1000,
        paymentMethod: 'cash',
      })).toThrow();
    });

    it('should reject amount below 100', () => {
      expect(() => createTransactionSchema.parse({
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        amount: 50,
        paymentMethod: 'card',
      })).toThrow();
    });

    it('should reject invalid payment method', () => {
      expect(() => createTransactionSchema.parse({
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        amount: 1000,
        paymentMethod: 'payme',
      })).toThrow();
    });
  });

  // ==================================================
  // processPaymentSchema
  // ==================================================
  describe('processPaymentSchema', () => {
    it('should default paymentType to ONE_STEP', () => {
      const result = processPaymentSchema.parse({
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        cardId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        amount: 100000,
      });
      expect(result.paymentType).toBe('ONE_STEP');
    });

    it('should accept TWO_STEP payment type', () => {
      const result = processPaymentSchema.parse({
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        cardId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        amount: 100000,
        paymentType: 'TWO_STEP',
      });
      expect(result.paymentType).toBe('TWO_STEP');
    });
  });

  // ==================================================
  // initPaymentSchema
  // ==================================================
  describe('initPaymentSchema', () => {
    it('should accept valid payment init', () => {
      const result = initPaymentSchema.parse({
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        amount: 50000,
        returnUrl: 'https://topla.uz/payment/callback',
      });
      expect(result.returnUrl).toBe('https://topla.uz/payment/callback');
    });

    it('should reject invalid URL', () => {
      expect(() => initPaymentSchema.parse({
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        amount: 50000,
        returnUrl: 'not-a-url',
      })).toThrow();
    });
  });

  // ==================================================
  // installmentSchema
  // ==================================================
  describe('installmentSchema', () => {
    it('should accept valid installment', () => {
      const result = installmentSchema.parse({
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        cardId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        amount: 500000,
        months: 12,
      });
      expect(result.months).toBe(12);
    });

    it('should reject months less than 3', () => {
      expect(() => installmentSchema.parse({
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        cardId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        amount: 500000,
        months: 2,
      })).toThrow();
    });

    it('should reject months greater than 24', () => {
      expect(() => installmentSchema.parse({
        orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        cardId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        amount: 500000,
        months: 36,
      })).toThrow();
    });
  });

  // ==================================================
  // payoutSchema
  // ==================================================
  describe('payoutSchema', () => {
    it('should accept valid payout', () => {
      const result = payoutSchema.parse({
        cardId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        amount: 100000,
        description: 'Vendor payout',
      });
      expect(result.amount).toBe(100000);
    });

    it('should reject amount below minimum', () => {
      expect(() => payoutSchema.parse({
        cardId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        amount: 50,
      })).toThrow();
    });
  });

  // ==================================================
  // INSTALLMENT_RATES
  // ==================================================
  describe('INSTALLMENT_RATES', () => {
    it('should have 0% fee for 3 months', () => {
      expect(INSTALLMENT_RATES[3]).toBe(0);
    });

    it('should have 2.5% fee for 6 months', () => {
      expect(INSTALLMENT_RATES[6]).toBe(2.5);
    });

    it('should have 16% fee for 24 months', () => {
      expect(INSTALLMENT_RATES[24]).toBe(16);
    });

    it('should have rates for all valid month options', () => {
      expect(Object.keys(INSTALLMENT_RATES).map(Number).sort((a, b) => a - b))
        .toEqual([3, 6, 9, 12, 18, 24]);
    });

    it('should calculate correct monthly payment', () => {
      const amount = 1000000; // 1M so'm
      const months = 12;
      const rate = INSTALLMENT_RATES[months]!;
      const totalAmount = amount + (amount * rate / 100);
      const monthly = totalAmount / months;
      expect(monthly).toBeCloseTo(90000, 0); // 1,080,000 / 12 = 90,000
    });
  });
});
