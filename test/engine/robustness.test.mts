import { describe, expect, it } from 'vitest';
import { detectLanguages, filterRulesForFile } from '../../src/engine/filter.js';
import { allRules } from '../../src/rules/index.js';

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
});
