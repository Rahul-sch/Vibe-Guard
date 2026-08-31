import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('cryptography algorithm rules', () => {
  it('detects deprecated hashes and non-cryptographic random values', () => {
    expectMatches('VG-CRYPTO-001', 'md5(input)');
    expectNoMatch('VG-CRYPTO-001', 'sha256(input)');
    expectMatches('VG-CRYPTO-002', 'SHA1(input)');
    expectNoMatch('VG-CRYPTO-002', 'SHA256(input)');
    expectMatches('VG-CRYPTO-003', 'const value = Math.random() + token');
    expectNoMatch('VG-CRYPTO-003', 'const token = crypto.randomUUID()');
  });
});
