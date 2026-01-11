import { describe, it, expect } from 'vitest';
import { formatPRComment, formatInlineComment } from '../../src/github/comment-formatter.js';
import type { ScanResult, Finding } from '../../src/rules/types.js';

describe('comment-formatter', () => {
  describe('formatPRComment', () => {
    it('formats comment with critical findings', () => {
      const result: ScanResult = {
        findings: [
          {
            ruleId: 'VG-SEC-001',
            file: 'test.js',
            line: 10,
            column: 5,
            match: 'eval(',
            snippet: 'eval(userInput)',
            message: 'Dangerous eval() usage',
            severity: 'critical',
            category: 'injection',
            confidence: 'high',
          },
        ],
        criticalCount: 1,
        warningCount: 0,
        infoCount: 0,
        filesScanned: 1,
        filesSkipped: 0,
        duration: 0.1,
      };

      const comment = formatPRComment(result);

      expect(comment).toContain('## 🛡️ VibeGuard Security Scan');
      expect(comment).toContain('🔴 Critical | 1');
      expect(comment).toContain('VG-SEC-001');
      expect(comment).toContain('test.js:10');
    });

    it('shows auto-fixable count when fixes available', () => {
      const result: ScanResult = {
        findings: [
          {
            ruleId: 'VG-SEC-001',
            file: 'test.js',
            line: 10,
            column: 5,
            match: 'eval(',
            matchOffset: 100,
            snippet: 'eval(userInput)',
            message: 'eval usage',
            severity: 'critical',
            category: 'injection',
            confidence: 'high',
          },
        ],
        criticalCount: 1,
        warningCount: 0,
        infoCount: 0,
        filesScanned: 1,
        filesSkipped: 0,
        duration: 0.1,
      };

      const comment = formatPRComment(result);

      expect(comment).toContain('Auto-fixable');
      expect(comment).toContain('React with 👍');
    });

    it('handles no findings gracefully', () => {
      const result: ScanResult = {
        findings: [],
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        filesScanned: 1,
        filesSkipped: 0,
        duration: 0.1,
      };

      const comment = formatPRComment(result);

      expect(comment).toContain('## 🛡️ VibeGuard Security Scan');
      expect(comment).toContain('🔴 Critical | 0');
      expect(comment).toContain('🟡 Warning | 0');
    });
  });

  describe('formatInlineComment', () => {
    it('formats inline comment with all fields', () => {
      const finding: Finding = {
        ruleId: 'VG-SEC-001',
        file: 'test.js',
        line: 10,
        column: 5,
        match: 'eval(',
        snippet: 'eval(userInput)',
        message: 'Dangerous eval() usage',
        severity: 'critical',
        category: 'injection',
        confidence: 'high',
        remediation: 'Use JSON.parse() instead',
        cwe: 'CWE-94',
      };

      const comment = formatInlineComment(finding);

      expect(comment).toContain('**VG-SEC-001**');
      expect(comment).toContain('Dangerous eval() usage');
      expect(comment).toContain('eval(userInput)');
      expect(comment).toContain('Use JSON.parse() instead');
      expect(comment).toContain('CWE-94');
      expect(comment).toContain('cwe.mitre.org');
    });

    it('shows auto-fix message for fixable findings', () => {
      const finding: Finding = {
        ruleId: 'VG-SEC-001',
        file: 'test.js',
        line: 10,
        column: 5,
        match: 'eval(',
        matchOffset: 100,
        snippet: 'eval(userInput)',
        message: 'eval usage',
        severity: 'critical',
        category: 'injection',
        confidence: 'high',
      };

      const comment = formatInlineComment(finding);

      expect(comment).toContain('auto-fixed');
    });
  });
});
