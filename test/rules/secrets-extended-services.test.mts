import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('extended service secret rules', () => {
  it('detects Stripe, GitHub, and Slack credentials', () => {
    expectMatches('VG-SEC-011', `sk_live_${'a'.repeat(24)}`);
    expectNoMatch('VG-SEC-011', 'sk_live_short');
    expectMatches('VG-SEC-012', `ghp_${'a'.repeat(36)}`);
    expectNoMatch('VG-SEC-012', 'ghp_short');
    expectMatches('VG-SEC-013', `https://hooks.slack.com/services/ABCDEFGHI/JKLMNOPQR/${'a'.repeat(24)}`);
    expectNoMatch('VG-SEC-013', 'https://hooks.slack.com/services/short');
  });

  it('detects JWT and generic API secrets', () => {
    expectMatches('VG-SEC-014', "jwt_secret = 'long-enough-secret'");
    expectNoMatch('VG-SEC-014', "jwt_secret = 'short'");
    expectMatches('VG-SEC-015', "apiKey = 'abcdefghijklmnopqrst'");
    expectNoMatch('VG-SEC-015', "apiKey = 'short'");
  });
});
