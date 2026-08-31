import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('cloud storage and IAM rules', () => {
  it('detects public and unencrypted cloud resources', () => {
    expectMatches('VG-CLOUD-001', "ACL = 'public-read'");
    expectNoMatch('VG-CLOUD-001', "ACL = 'private'");
    expectMatches('VG-CLOUD-002', '"Action": "*"');
    expectNoMatch('VG-CLOUD-002', '"Action": "s3:GetObject"');
    expectMatches('VG-CLOUD-003', 'cidr_blocks = ["0.0.0.0/0"]');
    expectNoMatch('VG-CLOUD-003', 'cidr_blocks = ["10.0.0.0/8"]');
    expectMatches('VG-CLOUD-004', 'encrypted = false');
    expectNoMatch('VG-CLOUD-004', 'encrypted = true');
  });
});
