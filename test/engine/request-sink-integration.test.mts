import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan } from '../../src/engine/index.js';

describe('request-to-sink scanner integration', () => {
  const directories: string[] = [];

  afterEach(async () => {
    await Promise.all(directories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    ));
  });

  it('routes Node and Python files and reports only direct request flows', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vibeguard-request-sinks-'));
    directories.push(directory);

    await writeFile(join(directory, 'routes.ts'), [
      'import fs from "node:fs";',
      'fs.readFile(req.query.path, callback);',
      'await fetch(req.body.url);',
      'fs.readFile(config.safePath, callback);',
      'await fetch(config.apiUrl);',
    ].join('\n'));

    await writeFile(join(directory, 'views.py'), [
      'import requests',
      'send_file(request.args.get("path"))',
      'requests.get(request.args["url"])',
      'send_file(settings.SAFE_EXPORT)',
      'requests.get(settings.API_URL)',
    ].join('\n'));

    const result = await scan({
      targetPath: directory,
      ruleIds: ['VG-NODE-006', 'VG-NODE-007', 'VG-PY-007', 'VG-PY-008'],
      includeSeverities: ['critical'],
    });

    expect(result.scannedFiles).toBe(2);
    expect(result.findings.map(({ ruleId, file, line }) => ({ ruleId, file, line })))
      .toEqual([
        { ruleId: 'VG-NODE-006', file: 'routes.ts', line: 2 },
        { ruleId: 'VG-NODE-007', file: 'routes.ts', line: 3 },
        { ruleId: 'VG-PY-007', file: 'views.py', line: 2 },
        { ruleId: 'VG-PY-008', file: 'views.py', line: 3 },
      ]);
  });
});
