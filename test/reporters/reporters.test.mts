import { describe, it, expect } from 'vitest';
import { ConsoleReporter } from '../../src/reporters/console.js';
import { JsonReporter } from '../../src/reporters/json.js';
import { SarifReporter } from '../../src/reporters/sarif.js';
import { createReporter } from '../../src/reporters/index.js';
import type { ScanResult, Finding } from '../../src/reporters/types.js';

const mockFinding: Finding = {
  ruleId: 'VG-SEC-001',
  title: 'Eval Usage',
  severity: 'critical',
  category: 'injection',
  file: 'src/test.js',
  line: 10,
  column: 5,
  snippet: 'eval(userInput)',
  match: 'eval(',
  message: 'eval() is dangerous',
  remediation: 'Do not use eval',
  cwe: 'CWE-95',
};

const mockResult: ScanResult = {
  scannedFiles: 100,
  skippedFiles: 10,
  totalFindings: 1,
  criticalCount: 1,
  warningCount: 0,
  infoCount: 0,
  findings: [mockFinding],
  duration: 1234,
  timestamp: '2024-01-15T10:00:00.000Z',
};

describe('ConsoleReporter', () => {
  it('formats output with findings', () => {
    const reporter = new ConsoleReporter(true); // noColor for predictable output
    const output = reporter.report(mockResult);

    expect(output).toContain('VG-SEC-001');
    expect(output).toContain('src/test.js');
    expect(output).toContain('10:5');
    expect(output).toContain('CRITICAL');
    expect(output).toContain('1 critical');
  });

  it('shows clean message when no findings', () => {
    const reporter = new ConsoleReporter(true);
    const cleanResult: ScanResult = {
      ...mockResult,
      totalFindings: 0,
      criticalCount: 0,
      findings: [],
    };
    const output = reporter.report(cleanResult);

    expect(output).toContain('No issues found');
  });
});

describe('JsonReporter', () => {
  it('outputs valid JSON', () => {
    const reporter = new JsonReporter();
    const output = reporter.report(mockResult);

    const parsed = JSON.parse(output);
    expect(parsed.version).toBeDefined();
    expect(parsed.summary.scannedFiles).toBe(100);
    expect(parsed.summary.critical).toBe(1);
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0].ruleId).toBe('VG-SEC-001');
  });

  it('includes timestamp and duration', () => {
    const reporter = new JsonReporter();
    const output = reporter.report(mockResult);
    const parsed = JSON.parse(output);

    expect(parsed.timestamp).toBe('2024-01-15T10:00:00.000Z');
    expect(parsed.summary.duration).toBe(1234);
  });
});

describe('SarifReporter', () => {
  it('outputs valid SARIF structure', () => {
    const reporter = new SarifReporter();
    const output = reporter.report(mockResult);

    const parsed = JSON.parse(output);
    expect(parsed.$schema).toContain('sarif');
    expect(parsed.version).toBe('2.1.0');
    expect(parsed.runs).toHaveLength(1);
  });

  it('includes tool information', () => {
    const reporter = new SarifReporter();
    const output = reporter.report(mockResult);
    const parsed = JSON.parse(output);

    const tool = parsed.runs[0].tool.driver;
    expect(tool.name).toBe('VibeGuard');
    expect(tool.rules).toHaveLength(1);
    expect(tool.rules[0].id).toBe('VG-SEC-001');
  });

  it('maps severity to SARIF levels', () => {
    const reporter = new SarifReporter();
    const output = reporter.report(mockResult);
    const parsed = JSON.parse(output);

    const result = parsed.runs[0].results[0];
    expect(result.level).toBe('error'); // critical maps to error
  });

  it('includes physical location', () => {
    const reporter = new SarifReporter();
    const output = reporter.report(mockResult);
    const parsed = JSON.parse(output);

    const location = parsed.runs[0].results[0].locations[0].physicalLocation;
    expect(location.artifactLocation.uri).toBe('src/test.js');
    expect(location.region.startLine).toBe(10);
    expect(location.region.startColumn).toBe(5);
  });
});

describe('createReporter factory', () => {
  it('creates console reporter by default', () => {
    const reporter = createReporter('console');
    expect(reporter).toBeInstanceOf(ConsoleReporter);
  });

  it('creates json reporter', () => {
    const reporter = createReporter('json');
    expect(reporter).toBeInstanceOf(JsonReporter);
  });

  it('creates sarif reporter', () => {
    const reporter = createReporter('sarif');
    expect(reporter).toBeInstanceOf(SarifReporter);
  });
});
