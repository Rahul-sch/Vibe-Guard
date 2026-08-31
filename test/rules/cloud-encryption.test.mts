import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('cloud encryption rules', () => {
  it('detects resources without required encryption and public Azure storage', () => {
    expectMatches('VG-CLOUD-005', 'resource "aws_db_instance" "main" {}');
    expectNoMatch('VG-CLOUD-005', 'resource "aws_db_instance" "main" { storage_encrypted = true }');
    expectMatches('VG-CLOUD-006', 'resource "aws_s3_bucket" "uploads" {}');
    expectNoMatch('VG-CLOUD-006', 'resource "aws_s3_bucket" "uploads" { kms_key_id = key.id }');
    expectMatches('VG-CLOUD-007', 'allow_blob_public_access = true');
    expectNoMatch('VG-CLOUD-007', 'allow_blob_public_access = false');
  });
});
