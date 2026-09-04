import { describe, expect, it } from 'vitest';
import { detectLanguages, filterRulesForFile } from '../../src/engine/filter.js';
import { matchRule } from '../../src/engine/matcher.js';
import { allRules } from '../../src/rules/index.js';
import type { DetectionRule } from '../../src/rules/types.js';

describe('engine robustness', () => {
  it('detects languages for framework and compound filenames', () => {
    expect(detectLanguages('Dockerfile')).toEqual(['docker']);
    expect(detectLanguages('build.release.dockerfile')).toEqual(['docker']);
    expect(detectLanguages('docker-compose.yaml')).toEqual(['docker', 'yaml']);
    expect(detectLanguages('deployment.production.yml')).toEqual(['kubernetes', 'yaml']);
    expect(detectLanguages('component.tsx')).toEqual(['node', 'typescript']);
    expect(detectLanguages('policy.json')).toEqual(['json']);
    expect(detectLanguages('notes.txt')).toEqual([]);
  });

  it('filters rules by both language and basename pattern', () => {
    const pythonIds = filterRulesForFile('handlers.py', allRules).map((rule) => rule.id);
    expect(pythonIds).toContain('VG-PY-001');
    expect(pythonIds).not.toContain('VG-NODE-001');

    const dockerIds = filterRulesForFile('Dockerfile', allRules).map((rule) => rule.id);
    expect(dockerIds).toContain('VG-DOCK-001');
    expect(dockerIds).not.toContain('VG-K8S-001');

    const unknownIds = filterRulesForFile('README.md', allRules).map((rule) => rule.id);
    expect(unknownIds).toEqual([]);
  });

  it('treats source-file extensions case-insensitively', () => {
    const lowerIds = filterRulesForFile('handler.js', allRules).map((rule) => rule.id);
    const upperIds = filterRulesForFile('HANDLER.JS', allRules).map((rule) => rule.id);
    expect(upperIds).toEqual(lowerIds);

    const lowerPythonIds = filterRulesForFile('worker.py', allRules).map((rule) => rule.id);
    const upperPythonIds = filterRulesForFile('WORKER.PY', allRules).map((rule) => rule.id);
    expect(upperPythonIds).toEqual(lowerPythonIds);
  });

  it('isolates global regex state and advances zero-width matches', () => {
    const evalRule = allRules.find((rule) => rule.id === 'VG-SEC-001')!;
    const source = 'eval(first); eval(second);';
    expect(matchRule(source, evalRule)).toHaveLength(2);
    expect(matchRule(source, evalRule)).toHaveLength(2);
    expect(evalRule.pattern.lastIndex).toBe(0);

    const zeroWidthRule: DetectionRule = {
      id: 'VG-TEST-001',
      title: 'zero width',
      severity: 'info',
      category: 'general',
      languages: ['node'],
      filePatterns: ['*.js'],
      pattern: /(?=a)/g,
      message: 'test only',
      confidence: 'high',
    };
    expect(matchRule('aa', zeroWidthRule)).toHaveLength(2);
  });
});
