import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('extended cloud secret rules', () => {
  it('detects AWS and GCP credentials', () => {
    expectMatches('VG-SEC-006', 'AKIA1234567890ABCDEF');
    expectNoMatch('VG-SEC-006', 'AKIA1234');
    expectMatches('VG-SEC-007', "aws_secret_access_key = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'");
    expectNoMatch('VG-SEC-007', "aws_secret_access_key = 'short'");
    expectMatches('VG-SEC-008', '{"type": "service_account"}');
    expectNoMatch('VG-SEC-008', '{"type": "user_account"}');
  });

  it('detects Azure storage keys and private key blocks', () => {
    expectMatches('VG-SEC-009', `AccountKey=${'a'.repeat(88)}==`);
    expectNoMatch('VG-SEC-009', 'AccountKey=not-a-storage-key');
    expectMatches('VG-SEC-010', '-----BEGIN RSA PRIVATE KEY-----');
    expectNoMatch('VG-SEC-010', '-----BEGIN PUBLIC KEY-----');
  });
});
