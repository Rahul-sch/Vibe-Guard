import { describe, it, expect } from 'vitest';
import { scan } from '../../src/engine/index.js';
import * as path from 'path';

/**
 * Coverage corpus test.
 *
 * Each entry asserts that a specific line in test/fixtures/coverage-corpus.js
 * triggers at least one of the listed rules. If detection regresses on these
 * patterns, the test fails loudly with the line number that stopped firing.
 */
describe('detection coverage corpus', () => {
  const fixturesPath = path.resolve(process.cwd(), 'test/fixtures');

  const expectations: Array<{ line: number; ruleIds: string[]; label: string }> = [
    { line: 5,  ruleIds: ['VG-SEC-006'],               label: 'AWS Access Key literal' },
    { line: 8,  ruleIds: ['VG-SEC-003'],               label: 'short hardcoded password' },
    { line: 11, ruleIds: ['VG-SEC-003', 'VG-SEC-015'], label: 'generic api key' },
    { line: 15, ruleIds: ['VG-NODE-001'],              label: 'exec with string concat' },
    { line: 18, ruleIds: ['VG-NODE-001'],              label: 'exec with template literal' },
    { line: 21, ruleIds: ['VG-SEC-001'],               label: 'eval()' },
    { line: 24, ruleIds: ['VG-WEB-001'],               label: 'CORS wildcard via cors() middleware' },
    { line: 27, ruleIds: ['VG-SEC-002'],               label: 'SQL string concatenation' },
    { line: 30, ruleIds: ['VG-WEB-008'],               label: 'reflected XSS via res.send' },
  ];

  it('flags every vulnerable line in the corpus', async () => {
    const result = await scan({
      targetPath: fixturesPath,
      includeSeverities: ['critical', 'warning', 'info'],
    });

    const corpus = result.findings.filter((f) => f.file.includes('coverage-corpus.js'));

    const missing: string[] = [];
    for (const exp of expectations) {
      const matched = corpus.some(
        (f) => f.line === exp.line && exp.ruleIds.includes(f.ruleId)
      );
      if (!matched) {
        missing.push(`line ${exp.line} (${exp.label}) — expected one of [${exp.ruleIds.join(', ')}]`);
      }
    }

    expect(missing, `Detection regressions:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  it('does not flag obvious placeholder strings', async () => {
    const result = await scan({
      targetPath: fixturesPath,
      includeSeverities: ['critical', 'warning', 'info'],
    });

    const corpus = result.findings.filter((f) => f.file.includes('coverage-corpus.js'));

    // Lines 33-35 are the negative-case placeholders.
    const falsePositives = corpus.filter(
      (f) => f.ruleId === 'VG-SEC-003' && f.line >= 33 && f.line <= 35
    );

    expect(
      falsePositives.map((f) => `${f.ruleId} L${f.line}: ${f.snippet}`),
      'Placeholder values should not trip VG-SEC-003'
    ).toEqual([]);
  });
});
