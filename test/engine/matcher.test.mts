import { describe, it, expect } from 'vitest';
import { matchRule, createFinding } from '../../src/engine/matcher.js';
import { buildLineIndex, offsetToLineCol, extractSnippet } from '../../src/utils/line-mapper.js';
import type { DetectionRule } from '../../src/rules/types.js';

describe('line-mapper', () => {
  const content = 'line1\nline2\nline3';
  const lineStarts = buildLineIndex(content);

  it('builds correct line index', () => {
    expect(lineStarts).toEqual([0, 6, 12]);
  });

  it('maps offset to line:col correctly', () => {
    expect(offsetToLineCol(0, lineStarts)).toEqual({ line: 1, column: 1 });
    expect(offsetToLineCol(6, lineStarts)).toEqual({ line: 2, column: 1 });
    expect(offsetToLineCol(8, lineStarts)).toEqual({ line: 2, column: 3 });
  });

  it('extracts snippet correctly', () => {
    expect(extractSnippet(content, 1, lineStarts)).toBe('line1');
    expect(extractSnippet(content, 2, lineStarts)).toBe('line2');
  });
});

describe('matcher', () => {
  const evalRule: DetectionRule = {
    id: 'VG-SEC-001',
    title: 'eval usage',
    severity: 'critical',
    category: 'injection',
    languages: ['node'],
    filePatterns: ['*.js'],
    pattern: /\beval\s*\(/g,
    message: 'eval is dangerous',
    confidence: 'high',
  };

  it('matches eval pattern', () => {
    const content = 'const x = eval(userInput);';
    const matches = matchRule(content, evalRule);
    expect(matches).toHaveLength(1);
    expect(matches[0].match).toBe('eval(');
    expect(matches[0].line).toBe(1);
  });

  it('returns empty for no matches', () => {
    const content = 'const x = JSON.parse(data);';
    const matches = matchRule(content, evalRule);
    expect(matches).toHaveLength(0);
  });

  it('finds multiple matches', () => {
    const content = 'eval(a);\neval(b);';
    const matches = matchRule(content, evalRule);
    expect(matches).toHaveLength(2);
    expect(matches[0].line).toBe(1);
    expect(matches[1].line).toBe(2);
  });

  it('respects allowPatterns', () => {
    const ruleWithAllow: DetectionRule = {
      ...evalRule,
      allowPatterns: [/eval\(/i],
    };
    const content = 'eval(testData);';
    const matches = matchRule(content, ruleWithAllow);
    expect(matches).toHaveLength(0);
  });

  it('creates finding correctly', () => {
    const content = 'const x = eval(userInput);';
    const matches = matchRule(content, evalRule);
    const finding = createFinding(evalRule, matches[0], 'src/test.js');

    expect(finding.ruleId).toBe('VG-SEC-001');
    expect(finding.file).toBe('src/test.js');
    expect(finding.line).toBe(1);
    expect(finding.severity).toBe('critical');
  });
});
