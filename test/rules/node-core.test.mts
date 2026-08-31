import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('Node core security rules', () => {
  it('detects dynamic shell execution and unsafe React HTML', () => {
    expectMatches('VG-NODE-001', 'exec(command)');
    expectNoMatch('VG-NODE-001', "execFile('git', ['status'])");
    expectMatches('VG-NODE-002', "spawn('sh', [], { shell: true })");
    expectNoMatch('VG-NODE-002', "spawn('git', ['status'])");
    expectMatches('VG-NODE-003', 'dangerouslySetInnerHTML={{ __html: html }}');
    expectNoMatch('VG-NODE-003', '<p>{text}</p>');
  });

  it('detects disabled TLS verification', () => {
    expectMatches('VG-NODE-004', 'rejectUnauthorized: false');
    expectNoMatch('VG-NODE-004', 'rejectUnauthorized: true');
    expectMatches('VG-NODE-005', 'NODE_TLS_REJECT_UNAUTHORIZED=0');
    expectNoMatch('VG-NODE-005', 'NODE_TLS_REJECT_UNAUTHORIZED=1');
  });
});
