import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('web CORS, cookie, redirect, and template rules', () => {
  it('detects unsafe web configuration and direct request rendering', () => {
    expectMatches('VG-WEB-001', "cors({ origin: '*' })");
    expectNoMatch('VG-WEB-001', "cors({ origin: 'https://app.example.com' })");
    expectMatches('VG-WEB-002', "res.setCookie('sid', token)");
    expectNoMatch('VG-WEB-002', "res.setCookie('sid', token, { secure: true, httpOnly: true })");
    expectMatches('VG-WEB-003', 'location = req.query');
    expectNoMatch('VG-WEB-003', "location = '/dashboard'");
    expectMatches('VG-WEB-004', '`${req.body.name}`');
    expectNoMatch('VG-WEB-004', '`${profile.name}`');
  });
});
