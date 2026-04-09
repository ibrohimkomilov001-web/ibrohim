/**
 * Slug Utility Tests — Phase 6
 * Tests for the pure generateSlugBase function
 */
import { describe, it, expect } from 'vitest';

import { generateSlugBase } from '../utils/slug.js';

describe('Slug Utils', () => {
  describe('generateSlugBase', () => {
    it('should convert English text to kebab-case', () => {
      expect(generateSlugBase('TechStore UZ')).toBe('techstore-uz');
    });

    it('should transliterate Cyrillic to Latin', () => {
      expect(generateSlugBase('Олтин Водий')).toBe('oltin-vodiy');
    });

    it('should handle mixed Cyrillic and numbers', () => {
      expect(generateSlugBase('Маркет 24')).toBe('market-24');
    });

    it('should remove special characters', () => {
      expect(generateSlugBase('Shop & Store!')).toBe('shop-store');
    });

    it('should collapse multiple spaces/dashes', () => {
      expect(generateSlugBase('my   super   shop')).toBe('my-super-shop');
    });

    it('should trim leading/trailing dashes', () => {
      expect(generateSlugBase(' --hello-- ')).toBe('hello');
    });

    it('should return "shop" for empty/symbol-only input', () => {
      expect(generateSlugBase('!!!')).toBe('shop');
      expect(generateSlugBase('')).toBe('shop');
    });

    it('should handle Uzbek Cyrillic: ш,ч,ғ,ў,қ,ҳ', () => {
      const result = generateSlugBase('Ўзбек шопинг');
      expect(result).toMatch(/^[a-z0-9-]+$/);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should lowercase everything', () => {
      expect(generateSlugBase('UPPERCASE')).toBe('uppercase');
    });

    it('should handle numbers in the middle', () => {
      expect(generateSlugBase('iPhone 15 Pro Max')).toBe('iphone-15-pro-max');
    });
  });
});
