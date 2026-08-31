import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('cryptography key rules', () => {
  it('detects embedded key material and weak key sizes', () => {
    expectMatches('VG-CRYPTO-004', "encryption_key = '0123456789abcdef'");
    expectNoMatch('VG-CRYPTO-004', 'encryption_key = process.env.KEY');
    expectMatches('VG-CRYPTO-005', "iv = '12345678'");
    expectNoMatch('VG-CRYPTO-005', 'iv = randomBytes(16)');
    expectMatches('VG-CRYPTO-006', "cipher = 'AES-ECB'");
    expectNoMatch('VG-CRYPTO-006', "cipher = 'AES-GCM'");
    expectMatches('VG-CRYPTO-007', 'modulusLength: 1024');
    expectNoMatch('VG-CRYPTO-007', 'modulusLength: 2048');
  });
});
