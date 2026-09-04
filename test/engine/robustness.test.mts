import { describe, expect, it } from 'vitest';
import { detectLanguages } from '../../src/engine/filter.js';

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
});
