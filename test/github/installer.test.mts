import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { installGitHubWorkflow } from '../../src/github/installer.js';

const TEST_DIR = join(process.cwd(), 'test', 'github', '__temp__');

describe('installer', () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('creates .github/workflows directory', () => {
    installGitHubWorkflow(TEST_DIR, {
      autoFix: true,
      severityThreshold: 'warning',
      aiVerify: false,
    });

    const workflowFile = join(TEST_DIR, '.github', 'workflows', 'vibeguard.yml');
    expect(existsSync(workflowFile)).toBe(true);
  });

  it('throws error if workflow already exists', () => {
    // First install
    installGitHubWorkflow(TEST_DIR, {
      autoFix: true,
      severityThreshold: 'warning',
      aiVerify: false,
    });

    // Second install should throw
    expect(() => {
      installGitHubWorkflow(TEST_DIR, {
        autoFix: true,
        severityThreshold: 'warning',
        aiVerify: false,
      });
    }).toThrow('workflow already exists');
  });

  it('creates workflow with correct options', () => {
    installGitHubWorkflow(TEST_DIR, {
      autoFix: false,
      severityThreshold: 'critical',
      aiVerify: true,
    });

    const workflowFile = join(TEST_DIR, '.github', 'workflows', 'vibeguard.yml');
    expect(existsSync(workflowFile)).toBe(true);

    const fs = require('fs');
    const content = fs.readFileSync(workflowFile, 'utf-8');
    expect(content).toContain('--severity critical');
    expect(content).toContain('--ai');
    expect(content).not.toContain('auto-fix:');
  });
});
