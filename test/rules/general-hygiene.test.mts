import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('general hygiene rules', () => {
  it('detects commented credentials, database hosts, and security TODOs', () => {
    expectMatches('VG-GEN-004', '// password: leaked-value');
    expectNoMatch('VG-GEN-004', '// user identifier');
    expectMatches('VG-GEN-005', "db_host = 'localhost'");
    expectNoMatch('VG-GEN-005', 'db_host = process.env.DB_HOST');
    expectMatches('VG-GEN-006', '// TODO sanitize uploaded files');
    expectNoMatch('VG-GEN-006', '// TODO improve page colors');
  });
});
