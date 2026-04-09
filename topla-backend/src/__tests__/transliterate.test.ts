/**
 * Transliterate Utility Tests — Phase 6
 * Pure function tests — no mocks needed
 */
import { describe, it, expect } from 'vitest';

import {
  latinToCyrillic,
  cyrillicToLatin,
  isCyrillic,
  isLatin,
  getTransliteratedQueries,
} from '../utils/transliterate.js';

describe('Transliterate Utils', () => {
  // ==================================================
  // latinToCyrillic
  // ==================================================
  describe('latinToCyrillic', () => {
    it('should convert basic Latin to Cyrillic', () => {
      expect(latinToCyrillic('telefon')).toBe('телефон');
    });

    it('should handle digraphs: sh → ш', () => {
      expect(latinToCyrillic('shaxar')).toBe('шахар');
    });

    it('should handle digraphs: ch → ч', () => {
      expect(latinToCyrillic('choy')).toBe('чой');
    });

    it('should handle special Uzbek: o\' → ў', () => {
      expect(latinToCyrillic("o'zbek")).toBe('ўзбек');
    });

    it("should handle special Uzbek: g' → ғ", () => {
      expect(latinToCyrillic("g'isht")).toBe('ғишт');
    });

    it('should preserve numbers and punctuation', () => {
      expect(latinToCyrillic('telefon 123!')).toBe('телефон 123!');
    });

    it('should handle uppercase letters', () => {
      expect(latinToCyrillic('Salom')).toBe('Салом');
    });

    it('should handle empty string', () => {
      expect(latinToCyrillic('')).toBe('');
    });
  });

  // ==================================================
  // cyrillicToLatin
  // ==================================================
  describe('cyrillicToLatin', () => {
    it('should convert basic Cyrillic to Latin', () => {
      expect(cyrillicToLatin('телефон')).toBe('telefon');
    });

    it('should handle ш → sh', () => {
      // х maps to 'x' in Cyrillic→Latin (not 'h')
      expect(cyrillicToLatin('шахар')).toBe('shaxar');
    });

    it('should handle ч → ch', () => {
      expect(cyrillicToLatin('чой')).toBe('choy');
    });

    it('should handle ў → o\'', () => {
      expect(cyrillicToLatin('ўзбек')).toBe("o'zbek");
    });

    it('should handle ғ → g\'', () => {
      expect(cyrillicToLatin('ғишт')).toBe("g'isht");
    });

    it('should handle ё → yo', () => {
      expect(cyrillicToLatin('ёш')).toBe('yosh');
    });

    it('should handle uppercase', () => {
      expect(cyrillicToLatin('Салом')).toBe('Salom');
    });

    it('should preserve numbers', () => {
      expect(cyrillicToLatin('телефон 123')).toBe('telefon 123');
    });
  });

  // ==================================================
  // isCyrillic
  // ==================================================
  describe('isCyrillic', () => {
    it('should return true for Cyrillic text', () => {
      expect(isCyrillic('телефон')).toBe(true);
    });

    it('should return false for Latin text', () => {
      expect(isCyrillic('telefon')).toBe(false);
    });

    it('should return false for numbers only', () => {
      expect(isCyrillic('12345')).toBe(false);
    });

    it('should return true for mixed text with Cyrillic', () => {
      expect(isCyrillic('test телефон')).toBe(true);
    });

    it('should detect special Uzbek Cyrillic chars: ў, ғ, қ, ҳ', () => {
      expect(isCyrillic('ўзбек')).toBe(true);
      expect(isCyrillic('ғишт')).toBe(true);
      expect(isCyrillic('қўл')).toBe(true);
      expect(isCyrillic('ҳавола')).toBe(true);
    });
  });

  // ==================================================
  // isLatin
  // ==================================================
  describe('isLatin', () => {
    it('should return true for Latin text', () => {
      expect(isLatin('telefon')).toBe(true);
    });

    it('should return false for Cyrillic text', () => {
      expect(isLatin('телефон')).toBe(false);
    });

    it('should return false for numbers only', () => {
      expect(isLatin('12345')).toBe(false);
    });

    it('should return false for mixed Latin+Cyrillic', () => {
      // isLatin checks that text has Latin AND no Cyrillic
      expect(isLatin('test телефон')).toBe(false);
    });
  });

  // ==================================================
  // getTransliteratedQueries
  // ==================================================
  describe('getTransliteratedQueries', () => {
    it('should return Latin + Cyrillic for Latin input', () => {
      const result = getTransliteratedQueries('telefon');
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('telefon');
      expect(result[1]).toBe('телефон');
    });

    it('should return Cyrillic + Latin for Cyrillic input', () => {
      const result = getTransliteratedQueries('телефон');
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('телефон');
      expect(result[1]).toBe('telefon');
    });

    it('should return single item for numeric input', () => {
      const result = getTransliteratedQueries('12345');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('12345');
    });

    it('should handle empty string', () => {
      const result = getTransliteratedQueries('');
      expect(result).toEqual(['']);
    });

    it('should trim whitespace', () => {
      const result = getTransliteratedQueries('  telefon  ');
      expect(result[0]).toBe('telefon');
    });
  });
});
