import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan } from '../../src/engine/index.js';

describe('adversarial scanner routing', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    ));
  });

  it('routes mixed file types and preserves safe near-misses', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vibeguard-adversarial-'));
    temporaryDirectories.push(directory);

    await Promise.all([
      writeFile(join(directory, 'routes.ts'), [
        'res.redirect(req.query.next);',
        'const matcher = new RegExp(req.body.pattern);',
        "res.redirect('/home');",
      ].join('\n')),
      writeFile(join(directory, 'handlers.py'), [
        'yaml.load(payload, Loader=yaml.SafeLoader)',
        'response["Location"] = request.GET["next"]',
        'subprocess.check_output(request.GET.get("command"))',
      ].join('\n')),
      writeFile(join(directory, 'Dockerfile'), 'FROM node:20\nRUN npm ci\n'),
      writeFile(join(directory, 'compose.yaml'), 'services:\n  app:\n    privileged: true\n'),
    ]);

    const result = await scan({
      targetPath: directory,
      ruleIds: [
        'VG-NODE-013', 'VG-NODE-016', 'VG-PY-003', 'VG-PY-015',
        'VG-PY-018', 'VG-DOCK-001', 'VG-DOCK-003',
      ],
      includeSeverities: ['critical', 'warning'],
    });

    expect(result.scannedFiles).toBe(4);
    expect(result.findings.map((finding) => finding.ruleId).sort()).toEqual([
      'VG-DOCK-001',
      'VG-DOCK-003',
      'VG-NODE-013',
      'VG-NODE-016',
      'VG-PY-015',
      'VG-PY-018',
    ]);
    expect(result.totalFindings).toBe(6);
    expect(result.criticalCount).toBe(5);
    expect(result.warningCount).toBe(1);
  });
});
