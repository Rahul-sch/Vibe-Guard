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
});
