import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('general configuration rules', () => {
  it('detects hardcoded IPs, debug settings, and broad chmod', () => {
    expectMatches('VG-GEN-001', "const host = '192.168.1.10'");
    expectNoMatch('VG-GEN-001', "const host = 'api.example.com'");
    expectMatches('VG-GEN-002', 'DEBUG=true');
    expectNoMatch('VG-GEN-002', 'DEBUG=false');
    expectMatches('VG-GEN-003', 'chmod 777 uploads');
    expectNoMatch('VG-GEN-003', 'chmod 755 uploads');
  });
});
