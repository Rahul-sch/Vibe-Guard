import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('core secret rules', () => {
  it('detects dynamic execution and SQL concatenation', () => {
    expectMatches('VG-SEC-001', 'eval(userInput)');
    expectNoMatch('VG-SEC-001', 'JSON.parse(userInput)');
    expectMatches('VG-SEC-002', "SELECT * FROM users WHERE id = ' + userId");
    expectNoMatch('VG-SEC-002', 'SELECT * FROM users WHERE id = ?');
  });

  it('detects exposed credentials and sensitive response handling', () => {
    expectMatches('VG-SEC-003', "password = 'supersecret123'");
    expectNoMatch('VG-SEC-003', "password = 'placeholder'");
    expectMatches('VG-SEC-004', 'console.log(token)');
    expectNoMatch('VG-SEC-004', 'console.log(userId)');
    expectMatches('VG-SEC-005', 'res.json({ token: sessionToken })');
    expectNoMatch('VG-SEC-005', 'res.json({ userId })');
  });
});
