/**
 * Pagination Utility Tests — Phase 6
 * Pure function tests — no mocks needed
 */
import { describe, it, expect } from 'vitest';

import { parsePagination, paginationMeta } from '../utils/pagination.js';

describe('Pagination Utils', () => {
  // ==================================================
  // parsePagination
  // ==================================================
  describe('parsePagination', () => {
    it('should return defaults for empty query', () => {
      const result = parsePagination({});
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('should parse valid page and limit', () => {
      const result = parsePagination({ page: '3', limit: '10' });
      expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
    });

    it('should clamp negative page to 1', () => {
      const result = parsePagination({ page: '-5' });
      expect(result.page).toBe(1);
      expect(result.skip).toBe(0);
    });

    it('should clamp page 0 to 1', () => {
      const result = parsePagination({ page: '0' });
      expect(result.page).toBe(1);
    });

    it('should clamp limit above MAX_LIMIT (100)', () => {
      const result = parsePagination({ limit: '999' });
      expect(result.limit).toBe(100);
    });

    it('should fall back to default for limit=0 (parseInt gives 0 which is falsy)', () => {
      const result = parsePagination({ limit: '0' });
      expect(result.limit).toBe(20); // 0 is falsy → falls back to DEFAULT_LIMIT
    });

    it('should clamp limit -1 to 1', () => {
      const result = parsePagination({ limit: '-1' });
      expect(result.limit).toBe(1);
    });

    it('should handle non-numeric strings as defaults', () => {
      const result = parsePagination({ page: 'abc', limit: 'xyz' });
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('should calculate correct skip for page 5, limit 10', () => {
      const result = parsePagination({ page: '5', limit: '10' });
      expect(result.skip).toBe(40); // (5-1)*10
    });

    it('should handle limit=100 (max allowed)', () => {
      const result = parsePagination({ limit: '100' });
      expect(result.limit).toBe(100);
    });
  });

  // ==================================================
  // paginationMeta
  // ==================================================
  describe('paginationMeta', () => {
    it('should calculate totalPages correctly', () => {
      const result = paginationMeta(1, 20, 100);
      expect(result.totalPages).toBe(5);
    });

    it('should return hasMore=true when more pages exist', () => {
      const result = paginationMeta(1, 20, 100);
      expect(result.hasMore).toBe(true);
    });

    it('should return hasMore=false on last page', () => {
      const result = paginationMeta(5, 20, 100);
      expect(result.hasMore).toBe(false);
    });

    it('should handle zero total', () => {
      const result = paginationMeta(1, 20, 0);
      expect(result.totalPages).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle single item', () => {
      const result = paginationMeta(1, 20, 1);
      expect(result.totalPages).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should ceil partial pages', () => {
      const result = paginationMeta(1, 20, 21);
      expect(result.totalPages).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it('should return all fields', () => {
      const result = paginationMeta(2, 10, 55);
      expect(result).toEqual({
        page: 2,
        limit: 10,
        total: 55,
        totalPages: 6,
        hasMore: true,
      });
    });
  });
});
