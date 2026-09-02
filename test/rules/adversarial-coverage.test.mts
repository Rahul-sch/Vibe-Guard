import { describe, expect, it } from 'vitest';
import { allRules } from '../../src/rules/index.js';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('adversarial rule coverage', () => {
  it('separates dynamic execution, concatenated SQL, and secret placeholders', () => {
    expectMatches('VG-SEC-001', 'const result = eval (payload)');
    expectNoMatch('VG-SEC-001', 'const evaluator = buildEvaluator(payload)');
    expectMatches('VG-SEC-002', 'const sql = `SELECT * FROM users WHERE id = ${userId}`');
    expectNoMatch('VG-SEC-002', 'const sql = "SELECT * FROM users WHERE id = ?"');
    expectMatches('VG-SEC-003', "auth_token = 'Abcdefgh12345678'");
    expectNoMatch('VG-SEC-003', "auth_token = 'changeme'");
  });
  it('distinguishes secret logging and response exposure from safe fields', () => {
    expectMatches('VG-SEC-004', 'print(api_key)');
    expectNoMatch('VG-SEC-004', 'print(request_id)');
    expectMatches('VG-SEC-005', 'return { private_key: keyMaterial }');
    expectNoMatch('VG-SEC-005', 'return { public_key: publicKey }');
  });
  it('checks cloud credential lengths and GCP account types', () => {
    expectMatches('VG-SEC-006', 'AKIAABCDEFGHIJKLMNOP');
    expectNoMatch('VG-SEC-006', 'ASIAABCDEFGHIJKLMNOP');
    expectMatches('VG-SEC-007', `AWS_SECRET_ACCESS_KEY = '${'z'.repeat(40)}'`);
    expectNoMatch('VG-SEC-007', `AWS_SECRET_ACCESS_KEY = '${'z'.repeat(39)}'`);
    expectMatches('VG-SEC-008', '"type" : "service_account"');
    expectNoMatch('VG-SEC-008', '"type" : "authorized_user"');
  });
  it('checks Azure key length and supported private key headers', () => {
    expectMatches('VG-SEC-009', `AccountKey=${'A'.repeat(88)}==`);
    expectNoMatch('VG-SEC-009', `AccountKey=${'A'.repeat(87)}==`);
    expectMatches('VG-SEC-010', '-----BEGIN OPENSSH PRIVATE KEY-----');
    expectMatches('VG-SEC-010', '-----BEGIN EC PRIVATE KEY-----');
    expectNoMatch('VG-SEC-010', '-----BEGIN CERTIFICATE-----');
  });
  it('checks service-token prefixes and minimum lengths', () => {
    expectMatches('VG-SEC-011', `pk_test_${'B'.repeat(24)}`);
    expectNoMatch('VG-SEC-011', `pk_test_${'B'.repeat(23)}`);
    expectMatches('VG-SEC-012', `gho_${'c'.repeat(36)}`);
    expectNoMatch('VG-SEC-012', `glpat-${'c'.repeat(36)}`);
    expectMatches('VG-SEC-013', `https://hooks.slack.com/services/${'A'.repeat(9)}/${'B'.repeat(9)}/${'c'.repeat(24)}`);
    expectNoMatch('VG-SEC-013', 'https://hooks.slack.com/workflows/example');
  });
});
