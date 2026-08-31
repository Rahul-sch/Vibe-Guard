import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('configuration and dependency rules', () => {
  it('detects exposed service and public S3 settings', () => {
    expectMatches('VG-CFG-001', "app.listen(3000, '0.0.0.0')");
    expectNoMatch('VG-CFG-001', "app.listen(3000, '127.0.0.1')");
    expectMatches('VG-CFG-002', 'ACL: public-read');
    expectNoMatch('VG-CFG-002', 'ACL: private');
  });

  it('detects likely hallucinated Python and npm imports', () => {
    expectMatches('VG-DEP-001', 'import secure_utils');
    expectNoMatch('VG-DEP-001', 'import requests');
    expectMatches('VG-DEP-002', "import '@enterprise/private-sdk'");
    expectNoMatch('VG-DEP-002', "import 'express'");
  });
});
