import { describe, it, expect } from 'vitest';
import { generateWorkflowYAML } from '../../src/github/workflow-generator.js';

describe('workflow-generator', () => {
  it('generates workflow with auto-fix enabled', () => {
    const workflow = generateWorkflowYAML({
      autoFix: true,
      severityThreshold: 'warning',
      aiVerify: false,
    });

    expect(workflow).toContain('name: VibeGuard Security Scan');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('issue_comment:');
    expect(workflow).toContain('auto-fix:');
    expect(workflow).toContain('vibeguard fix --yes');
    expect(workflow).toContain('contents: write');
  });

  it('generates workflow without auto-fix', () => {
    const workflow = generateWorkflowYAML({
      autoFix: false,
      severityThreshold: 'critical',
      aiVerify: false,
    });

    expect(workflow).toContain('name: VibeGuard Security Scan');
    expect(workflow).toContain('pull_request:');
    expect(workflow).not.toContain('issue_comment:');
    expect(workflow).not.toContain('auto-fix:');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('--severity critical');
  });

  it('includes AI verification flag when enabled', () => {
    const workflow = generateWorkflowYAML({
      autoFix: true,
      severityThreshold: 'warning',
      aiVerify: true,
    });

    expect(workflow).toContain('--ai');
  });

  it('does not include AI flag when disabled', () => {
    const workflow = generateWorkflowYAML({
      autoFix: true,
      severityThreshold: 'warning',
      aiVerify: false,
    });

    expect(workflow).not.toContain('--ai');
  });

  it('uses correct severity threshold', () => {
    const workflow = generateWorkflowYAML({
      autoFix: false,
      severityThreshold: 'info',
      aiVerify: false,
    });

    expect(workflow).toContain('--severity info');
  });
});
