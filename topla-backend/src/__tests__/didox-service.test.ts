/**
 * Didox Service Unit Tests — Phase 6
 * Tests for: createAndSendContract, getContractStatus, isDidoxConfigured
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock env
vi.mock('../config/env.js', () => ({
  env: {
    DIDOX_API_TOKEN: 'test-token-123',
    DIDOX_API_URL: 'https://api.didox.uz',
    DIDOX_COMPANY_TIN: '123456789',
  },
}));

import {
  createAndSendContract,
  getContractStatus,
  isDidoxConfigured,
  type DidoxContractParams,
} from '../services/didox.service.js';

describe('Didox Service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ==================================================
  // isDidoxConfigured
  // ==================================================
  describe('isDidoxConfigured', () => {
    it('should return true when DIDOX_API_TOKEN and DIDOX_COMPANY_TIN are set', () => {
      expect(isDidoxConfigured()).toBe(true);
    });
  });

  // ==================================================
  // createAndSendContract
  // ==================================================
  describe('createAndSendContract', () => {
    const params: DidoxContractParams = {
      vendorTin: '987654321',
      vendorName: 'Test Vendor LLC',
      vendorEmail: 'vendor@test.com',
      shopName: 'Test Shop',
      commissionRate: 10,
    };

    it('should create and send contract successfully', async () => {
      // Mock create contract
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'contract-123',
          view_url: 'https://didox.uz/view/contract-123',
          status: 'draft',
        }),
      });

      // Mock send contract
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'sent' }),
      });

      const result = await createAndSendContract(params);

      expect(result).toEqual({
        contractId: 'contract-123',
        contractUrl: 'https://didox.uz/view/contract-123',
        status: 'sent',
      });

      // Verify create call
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const createCall = mockFetch.mock.calls[0];
      expect(createCall[0]).toBe('https://api.didox.uz/v1/contracts');
      expect(createCall[1].method).toBe('POST');
      expect(createCall[1].headers.Authorization).toBe('Bearer test-token-123');

      const createBody = JSON.parse(createCall[1].body);
      expect(createBody.seller_tin).toBe('123456789');
      expect(createBody.buyer_tin).toBe('987654321');
      expect(createBody.buyer_name).toBe('Test Vendor LLC');
      expect(createBody.items[0].name).toContain('Test Shop');
      expect(createBody.items[0].description).toContain('10%');

      // Verify send call
      const sendCall = mockFetch.mock.calls[1];
      expect(sendCall[0]).toBe('https://api.didox.uz/v1/contracts/contract-123/send');
      expect(sendCall[1].method).toBe('POST');
      const sendBody = JSON.parse(sendCall[1].body);
      expect(sendBody.buyer_email).toBe('vendor@test.com');
    });

    it('should throw error when contract creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid TIN',
      });

      await expect(createAndSendContract(params)).rejects.toThrow(
        'Didox shartnoma yaratishda xato: 400 — Invalid TIN',
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when contract sending fails', async () => {
      // Create succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'contract-456',
          view_url: 'https://didox.uz/view/contract-456',
          status: 'draft',
        }),
      });

      // Send fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal error',
      });

      await expect(createAndSendContract(params)).rejects.toThrow(
        'Didox shartnoma yuborishda xato: 500 — Internal error',
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should include contract_date as today in ISO format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'c-789',
          view_url: 'https://didox.uz/view/c-789',
          status: 'draft',
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await createAndSendContract(params);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Should match YYYY-MM-DD format
      expect(body.contract_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // ==================================================
  // getContractStatus
  // ==================================================
  describe('getContractStatus', () => {
    it('should return signed contract status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'contract-123',
          status: 'signed',
          signed_at: '2025-01-15T10:30:00Z',
          rejected_at: null,
          reject_reason: null,
        }),
      });

      const result = await getContractStatus('contract-123');

      expect(result).toEqual({
        contractId: 'contract-123',
        status: 'signed',
        signedAt: '2025-01-15T10:30:00Z',
        rejectedAt: null,
        rejectReason: null,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.didox.uz/v1/contracts/contract-123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        }),
      );
    });

    it('should return rejected contract with reason', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'contract-456',
          status: 'rejected',
          signed_at: null,
          rejected_at: '2025-01-16T14:00:00Z',
          reject_reason: 'INN noto\'g\'ri',
        }),
      });

      const result = await getContractStatus('contract-456');

      expect(result.status).toBe('rejected');
      expect(result.rejectedAt).toBe('2025-01-16T14:00:00Z');
      expect(result.rejectReason).toBe('INN noto\'g\'ri');
    });

    it('should throw error when status check fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Contract not found',
      });

      await expect(getContractStatus('nonexistent')).rejects.toThrow(
        'Didox shartnoma holatini olishda xato: 404 — Contract not found',
      );
    });

    it('should handle sent/viewed/draft statuses', async () => {
      for (const status of ['draft', 'sent', 'viewed']) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'c-1', status }),
        });
        const result = await getContractStatus('c-1');
        expect(result.status).toBe(status);
      }
    });
  });
});
