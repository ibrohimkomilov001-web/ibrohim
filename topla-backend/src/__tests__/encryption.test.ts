/**
 * Encryption Utility Tests — Phase 6
 * Tests encrypt/decrypt round-trip
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-for-encryption-tests-12345',
  },
}));

import { encrypt, decrypt } from '../utils/encryption.js';

describe('Encryption Utils', () => {
  describe('encrypt + decrypt round-trip', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'card-token-123456';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same input (random IV)', () => {
      const plaintext = 'same-input';
      const enc1 = encrypt(plaintext);
      const enc2 = encrypt(plaintext);
      expect(enc1).not.toBe(enc2);
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('');
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'кириллица & символы! @#$%';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('encrypted format should be iv:tag:data in hex', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      // IV is 16 bytes = 32 hex chars
      expect(parts[0]).toMatch(/^[0-9a-f]{32}$/);
      // Auth tag is 16 bytes = 32 hex chars
      expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
      // Encrypted data is hex
      expect(parts[2]).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('decrypt error handling', () => {
    it('should throw on invalid format (no colons)', () => {
      expect(() => decrypt('invalid')).toThrow('Noto\'g\'ri shifrlangan format');
    });

    it('should throw on tampered ciphertext', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');
      // Tamper with auth tag
      parts[1] = '0'.repeat(32);
      expect(() => decrypt(parts.join(':'))).toThrow();
    });

    it('should throw on tampered data', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');
      parts[2] = '0'.repeat(parts[2]!.length);
      expect(() => decrypt(parts.join(':'))).toThrow();
    });
  });
});
