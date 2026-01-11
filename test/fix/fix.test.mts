import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  isFixable,
  getFixableFindings,
  generateFix,
  generateFixes,
  generateUnifiedDiff,
  applyFixes,
  getStrategy,
  strategies,
} from '../../src/fix/index.js';
import { scan } from '../../src/engine/index.js';
import type { Finding } from '../../src/rules/types.js';

const TEST_DIR = join(process.cwd(), 'test', 'fix', '__temp__');

describe('fix strategies', () => {
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

  describe('eval-to-json-parse strategy', () => {
    it('converts eval(x) to JSON.parse(x)', () => {
      const strategy = getStrategy('eval-to-json-parse');
      expect(strategy).toBeDefined();

      const testFile = join(TEST_DIR, 'eval-test.js');
      const content = 'const data = eval(userInput);';
      writeFileSync(testFile, content);

      const finding: Finding = {
        ruleId: 'VG-SEC-001',
        file: testFile,
        line: 1,
        column: 14,
        match: 'eval(',
        matchOffset: 13,
        snippet: content,
        message: 'eval usage',
        severity: 'critical',
        category: 'injection',
        confidence: 'high',
      };

      const result = strategy!.generateFix(finding, content);
      expect(result.success).toBe(true);
      expect(result.fix).toBeDefined();
      expect(result.fix!.replacement).toBe('JSON.parse(userInput)');
    });

    it('handles nested parentheses', () => {
      const strategy = getStrategy('eval-to-json-parse');
      const content = 'const data = eval(process(input));';

      const finding: Finding = {
        ruleId: 'VG-SEC-001',
        file: 'test.js',
        line: 1,
        column: 14,
        match: 'eval(',
        matchOffset: 13,
        snippet: content,
        message: 'eval usage',
        severity: 'critical',
        category: 'injection',
        confidence: 'high',
      };

      const result = strategy!.generateFix(finding, content);
      expect(result.success).toBe(true);
      expect(result.fix!.replacement).toBe('JSON.parse(process(input))');
    });
  });

  describe('shell-true-to-false strategy', () => {
    it('converts shell=True to shell=False', () => {
      const strategy = getStrategy('shell-true-to-false');
      expect(strategy).toBeDefined();

      const content = 'subprocess.run("ls -la", shell=True)';

      const finding: Finding = {
        ruleId: 'VG-PY-001',
        file: 'test.py',
        line: 1,
        column: 1,
        match: 'subprocess.run("ls -la", shell=True)',
        matchOffset: 0,
        snippet: content,
        message: 'shell=True is dangerous',
        severity: 'critical',
        category: 'injection',
        confidence: 'high',
      };

      const result = strategy!.generateFix(finding, content);
      expect(result.success).toBe(true);
      expect(result.fix!.replacement).toContain('shell=False');
    });
  });

  describe('remove-verify-false strategy', () => {
    it('removes verify=False from requests call', () => {
      const strategy = getStrategy('remove-verify-false');
      expect(strategy).toBeDefined();

      const content = 'requests.get("https://api.example.com", verify=False)';

      const finding: Finding = {
        ruleId: 'VG-PY-006',
        file: 'test.py',
        line: 1,
        column: 1,
        match: content,
        matchOffset: 0,
        snippet: content,
        message: 'SSL verification disabled',
        severity: 'critical',
        category: 'crypto',
        confidence: 'high',
      };

      const result = strategy!.generateFix(finding, content);
      expect(result.success).toBe(true);
      expect(result.fix!.replacement).not.toContain('verify=False');
    });

    it('handles verify=False with other arguments', () => {
      const strategy = getStrategy('remove-verify-false');
      const content = 'requests.get(url, headers=h, verify=False, timeout=30)';

      const finding: Finding = {
        ruleId: 'VG-PY-006',
        file: 'test.py',
        line: 1,
        column: 1,
        match: content,
        matchOffset: 0,
        snippet: content,
        message: 'SSL verification disabled',
        severity: 'critical',
        category: 'crypto',
        confidence: 'high',
      };

      const result = strategy!.generateFix(finding, content);
      expect(result.success).toBe(true);
      expect(result.fix!.replacement).not.toContain('verify=False');
    });
  });

  describe('hardcoded-to-env strategy', () => {
    it('converts JS hardcoded secret to process.env', () => {
      const strategy = getStrategy('hardcoded-to-env');
      expect(strategy).toBeDefined();

      const content = 'const apiKey = "secret123"';

      const finding: Finding = {
        ruleId: 'VG-SEC-003',
        file: 'test.js',
        line: 1,
        column: 1,
        match: 'apiKey = "secret123"',
        matchOffset: 6,
        snippet: content,
        message: 'Hardcoded secret',
        severity: 'critical',
        category: 'secrets',
        confidence: 'high',
      };

      const result = strategy!.generateFix(finding, content);
      expect(result.success).toBe(true);
      expect(result.fix!.replacement).toContain('process.env.');
      expect(result.fix!.replacement).toContain('API_KEY');
    });

    it('converts Python hardcoded secret to os.environ.get', () => {
      const strategy = getStrategy('hardcoded-to-env');
      const content = 'api_key = "secret123"';

      const finding: Finding = {
        ruleId: 'VG-SEC-003',
        file: 'test.py',
        line: 1,
        column: 1,
        match: 'api_key = "secret123"',
        matchOffset: 0,
        snippet: content,
        message: 'Hardcoded secret',
        severity: 'critical',
        category: 'secrets',
        confidence: 'high',
      };

      const result = strategy!.generateFix(finding, content);
      expect(result.success).toBe(true);
      expect(result.fix!.replacement).toContain('os.environ.get');
      expect(result.fix!.replacement).toContain('API_KEY');
    });
  });
});

describe('fix engine', () => {
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

  describe('isFixable', () => {
    it('returns true for fixable findings', () => {
      const finding: Finding = {
        ruleId: 'VG-SEC-001', // eval - is fixable
        file: 'test.js',
        line: 1,
        column: 1,
        match: 'eval(',
        snippet: 'eval(x)',
        message: 'eval usage',
        severity: 'critical',
        category: 'injection',
        confidence: 'high',
      };

      expect(isFixable(finding)).toBe(true);
    });

    it('returns false for non-fixable findings', () => {
      const finding: Finding = {
        ruleId: 'VG-SEC-002', // SQL injection - not currently fixable
        file: 'test.js',
        line: 1,
        column: 1,
        match: 'SELECT * FROM users WHERE id = ${id}',
        snippet: 'SELECT * FROM users WHERE id = ${id}',
        message: 'SQL injection',
        severity: 'critical',
        category: 'injection',
        confidence: 'high',
      };

      expect(isFixable(finding)).toBe(false);
    });
  });

  describe('getFixableFindings', () => {
    it('filters to only fixable findings', () => {
      const findings: Finding[] = [
        {
          ruleId: 'VG-SEC-001', // fixable
          file: 'test.js',
          line: 1,
          column: 1,
          match: 'eval(',
          snippet: 'eval(x)',
          message: 'eval usage',
          severity: 'critical',
          category: 'injection',
          confidence: 'high',
        },
        {
          ruleId: 'VG-SEC-002', // not fixable
          file: 'test.js',
          line: 2,
          column: 1,
          match: 'SELECT',
          snippet: 'SELECT * FROM users',
          message: 'SQL injection',
          severity: 'critical',
          category: 'injection',
          confidence: 'high',
        },
        {
          ruleId: 'VG-PY-001', // fixable
          file: 'test.py',
          line: 1,
          column: 1,
          match: 'shell=True',
          snippet: 'subprocess.run(cmd, shell=True)',
          message: 'shell=True',
          severity: 'critical',
          category: 'injection',
          confidence: 'high',
        },
      ];

      const fixable = getFixableFindings(findings);
      expect(fixable).toHaveLength(2);
      expect(fixable[0].ruleId).toBe('VG-SEC-001');
      expect(fixable[1].ruleId).toBe('VG-PY-001');
    });
  });

  describe('generateFix', () => {
    it('generates fix for VG-SEC-001 (eval)', async () => {
      const testFile = join(TEST_DIR, 'eval-fix.js');
      writeFileSync(testFile, 'const data = eval(userInput);');

      const finding: Finding = {
        ruleId: 'VG-SEC-001',
        file: 'eval-fix.js',
        line: 1,
        column: 14,
        match: 'eval(',
        matchOffset: 13,
        snippet: 'const data = eval(userInput);',
        message: 'eval usage',
        severity: 'critical',
        category: 'injection',
        confidence: 'high',
      };

      const result = await generateFix(finding, TEST_DIR);
      expect(result.success).toBe(true);
      expect(result.fix).toBeDefined();
      expect(result.fix!.replacement).toBe('JSON.parse(userInput)');
    });
  });

  describe('applyFixes', () => {
    it('applies fix to file', () => {
      const testFile = join(TEST_DIR, 'apply-test.js');
      const originalContent = 'const data = eval(userInput);';
      writeFileSync(testFile, originalContent);

      const fix = {
        file: testFile,
        start: 13,
        end: 28,
        original: 'eval(userInput)',
        replacement: 'JSON.parse(userInput)',
        ruleId: 'VG-SEC-001',
      };

      const result = applyFixes(testFile, [fix]);
      expect(result.applied).toBe(true);

      const newContent = readFileSync(testFile, 'utf-8');
      expect(newContent).toBe('const data = JSON.parse(userInput);');
      expect(newContent).not.toContain('eval');
    });

    it('applies multiple fixes in correct order', () => {
      const testFile = join(TEST_DIR, 'multi-fix.js');
      const originalContent = 'eval(a);\neval(b);';
      writeFileSync(testFile, originalContent);

      // Fixes should be sorted by position (reverse order) internally
      const fixes = [
        {
          file: testFile,
          start: 0,
          end: 7,
          original: 'eval(a)',
          replacement: 'JSON.parse(a)',
          ruleId: 'VG-SEC-001',
        },
        {
          file: testFile,
          start: 9,
          end: 16,
          original: 'eval(b)',
          replacement: 'JSON.parse(b)',
          ruleId: 'VG-SEC-001',
        },
      ];

      const result = applyFixes(testFile, fixes);
      expect(result.applied).toBe(true);

      const newContent = readFileSync(testFile, 'utf-8');
      expect(newContent).toBe('JSON.parse(a);\nJSON.parse(b);');
    });
  });

  describe('generateUnifiedDiff', () => {
    it('generates proper unified diff format', () => {
      const fix = {
        file: 'test.js',
        start: 0,
        end: 7,
        original: 'eval(x)',
        replacement: 'JSON.parse(x)',
        ruleId: 'VG-SEC-001',
      };

      const diff = generateUnifiedDiff(fix);
      expect(diff).toContain('--- a/test.js');
      expect(diff).toContain('+++ b/test.js');
      expect(diff).toContain('-eval(x)');
      expect(diff).toContain('+JSON.parse(x)');
    });
  });
});

describe('integration: fix reduces findings', () => {
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

  it('applying fix for eval removes the finding', async () => {
    const testFile = join(TEST_DIR, 'test-eval.js');
    writeFileSync(testFile, 'const data = eval(userInput);');

    // Scan before fix
    const beforeResult = await scan({ targetPath: TEST_DIR, includeSeverities: ['critical', 'warning', 'info'] });
    const evalFindings = beforeResult.findings.filter(f => f.ruleId === 'VG-SEC-001');
    expect(evalFindings.length).toBeGreaterThan(0);

    // Get fix
    const finding = evalFindings[0];
    const fixResult = await generateFix(finding, TEST_DIR);
    expect(fixResult.success).toBe(true);

    // Apply fix
    const applyResult = applyFixes(fixResult.fix!.file, [fixResult.fix!]);
    expect(applyResult.applied).toBe(true);

    // Scan after fix
    const afterResult = await scan({ targetPath: TEST_DIR, includeSeverities: ['critical', 'warning', 'info'] });
    const remainingEvalFindings = afterResult.findings.filter(f => f.ruleId === 'VG-SEC-001');
    expect(remainingEvalFindings.length).toBe(0);
  });

  it('applying fix for shell=True removes the finding', async () => {
    const testFile = join(TEST_DIR, 'test-shell.py');
    writeFileSync(testFile, 'import subprocess\nsubprocess.run("ls", shell=True)');

    // Scan before fix
    const beforeResult = await scan({ targetPath: TEST_DIR, includeSeverities: ['critical', 'warning', 'info'] });
    const shellFindings = beforeResult.findings.filter(f => f.ruleId === 'VG-PY-001');
    expect(shellFindings.length).toBeGreaterThan(0);

    // Get fix
    const finding = shellFindings[0];
    const fixResult = await generateFix(finding, TEST_DIR);
    expect(fixResult.success).toBe(true);

    // Apply fix
    const applyResult = applyFixes(fixResult.fix!.file, [fixResult.fix!]);
    expect(applyResult.applied).toBe(true);

    // Scan after fix
    const afterResult = await scan({ targetPath: TEST_DIR, includeSeverities: ['critical', 'warning', 'info'] });
    const remainingShellFindings = afterResult.findings.filter(f => f.ruleId === 'VG-PY-001');
    expect(remainingShellFindings.length).toBe(0);
  });

  it('applying fix for verify=False removes the finding', async () => {
    const testFile = join(TEST_DIR, 'test-verify.py');
    writeFileSync(testFile, 'import requests\nrequests.get("https://api.example.com", verify=False)');

    // Scan before fix
    const beforeResult = await scan({ targetPath: TEST_DIR, includeSeverities: ['critical', 'warning', 'info'] });
    const verifyFindings = beforeResult.findings.filter(f => f.ruleId === 'VG-PY-006');
    expect(verifyFindings.length).toBeGreaterThan(0);

    // Get fix
    const finding = verifyFindings[0];
    const fixResult = await generateFix(finding, TEST_DIR);
    expect(fixResult.success).toBe(true);

    // Apply fix
    const applyResult = applyFixes(fixResult.fix!.file, [fixResult.fix!]);
    expect(applyResult.applied).toBe(true);

    // Scan after fix
    const afterResult = await scan({ targetPath: TEST_DIR, includeSeverities: ['critical', 'warning', 'info'] });
    const remainingVerifyFindings = afterResult.findings.filter(f => f.ruleId === 'VG-PY-006');
    expect(remainingVerifyFindings.length).toBe(0);
  });
});
