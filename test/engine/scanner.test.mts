import { describe, it, expect } from 'vitest';
import { scan } from '../../src/engine/index.js';
import * as path from 'path';

describe('scanner', () => {
  const fixturesPath = path.resolve(process.cwd(), 'test/fixtures');

  it('finds vulnerabilities in Python fixture', async () => {
    const result = await scan({
      targetPath: fixturesPath,
      includeSeverities: ['critical', 'warning'],
    });

    expect(result.scannedFiles).toBeGreaterThan(0);
    expect(result.totalFindings).toBeGreaterThan(0);

    const pythonFindings = result.findings.filter((f) =>
      f.file.includes('vulnerable-python.py')
    );
    expect(pythonFindings.length).toBeGreaterThan(5);

    const ruleIds = pythonFindings.map((f) => f.ruleId);
    expect(ruleIds).toContain('VG-PY-001');
    expect(ruleIds).toContain('VG-PY-002');
    expect(ruleIds).toContain('VG-SEC-001');
  });

  it('finds vulnerabilities in Node fixture', async () => {
    const result = await scan({
      targetPath: fixturesPath,
      includeSeverities: ['critical', 'warning'],
    });

    const nodeFindings = result.findings.filter((f) =>
      f.file.includes('vulnerable-node.js')
    );
    expect(nodeFindings.length).toBeGreaterThan(5);

    const ruleIds = nodeFindings.map((f) => f.ruleId);
    expect(ruleIds).toContain('VG-NODE-001');
    expect(ruleIds).toContain('VG-NODE-004');
    expect(ruleIds).toContain('VG-SEC-001');
  });

  it('finds vulnerabilities in K8s fixture', async () => {
    const result = await scan({
      targetPath: fixturesPath,
      includeSeverities: ['critical', 'warning'],
    });

    const k8sFindings = result.findings.filter((f) =>
      f.file.includes('k8s-vulnerable.yaml')
    );
    expect(k8sFindings.length).toBeGreaterThan(0);

    const ruleIds = k8sFindings.map((f) => f.ruleId);
    expect(ruleIds).toContain('VG-K8S-001');
    expect(ruleIds).toContain('VG-K8S-002');
  });

  it('finds Docker socket and privileged in compose', async () => {
    const result = await scan({
      targetPath: fixturesPath,
      includeSeverities: ['critical', 'warning'],
    });

    const dockerFindings = result.findings.filter((f) =>
      f.file.includes('docker-compose')
    );
    expect(dockerFindings.length).toBeGreaterThan(0);

    const ruleIds = dockerFindings.map((f) => f.ruleId);
    expect(ruleIds).toContain('VG-DOCK-002');
    expect(ruleIds).toContain('VG-DOCK-003');
  });

  it('respects ruleIds filter', async () => {
    const result = await scan({
      targetPath: fixturesPath,
      ruleIds: ['VG-SEC-001'],
      includeSeverities: ['critical', 'warning', 'info'],
    });

    expect(result.findings.every((f) => f.ruleId === 'VG-SEC-001')).toBe(true);
  });

  it('returns correct counts', async () => {
    const result = await scan({
      targetPath: fixturesPath,
      includeSeverities: ['critical', 'warning'],
    });

    expect(result.criticalCount + result.warningCount).toBe(result.totalFindings);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.timestamp).toBeTruthy();
  });
});
