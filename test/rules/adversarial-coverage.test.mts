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
});
