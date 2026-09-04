import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('rule robustness matrix', () => {
  it('recognizes secret variable aliases while preserving placeholders', () => {
    expectMatches('VG-SEC-003', "private-key: 'AbCd1234+/=='");
    expectMatches('VG-SEC-003', "passwd = 'correct-horse-1'");
    expectNoMatch('VG-SEC-003', "private-key: '<generated-value>'");
    expectNoMatch('VG-SEC-003', "passwd = 'dummy'");
  });
  it('checks exact cloud and source-control token formats', () => {
    expectMatches('VG-SEC-006', 'prefix-AKIA0000000000000000-suffix');
    expectNoMatch('VG-SEC-006', 'prefix-AKIA000000000000000-suffix');
    expectMatches('VG-SEC-012', `ghu_${'A_'.repeat(18)}`);
    expectNoMatch('VG-SEC-012', `ghs_${'A'.repeat(36)}`);
  });
  it('covers Node exec templates, concatenation, and safe executable APIs', () => {
    expectMatches('VG-NODE-001', 'exec(`convert ${filename}`)');
    expectMatches('VG-NODE-001', 'exec("convert " + filename)');
    expectMatches('VG-NODE-001', 'execSync(command)');
    expectNoMatch('VG-NODE-001', 'execFile("convert", [filename])');
  });
  it('covers spawn shell option placement and safe settings', () => {
    expectMatches('VG-NODE-002', "spawn(command, args, { cwd: '/tmp', shell: true })");
    expectMatches('VG-NODE-002', 'spawn(command, [], { shell:true, timeout: 1000 })');
    expectNoMatch('VG-NODE-002', 'spawn(command, args, { shell: false })');
    expectNoMatch('VG-NODE-002', 'spawn(command, args)');
  });
});
