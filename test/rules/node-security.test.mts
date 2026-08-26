import { describe, expect, it } from 'vitest';
import { matchRule } from '../../src/engine/matcher.js';
import { ruleById } from '../../src/rules/index.js';

function matches(ruleId: string, source: string) {
  const rule = ruleById.get(ruleId);
  if (!rule) throw new Error(`Missing rule ${ruleId}`);
  return matchRule(source, rule);
}

describe('Node request-to-sink rules', () => {
  it.each([
    ['VG-NODE-006', 'fs.readFile(req.query.path, callback)'],
    ['VG-NODE-006', 'res.sendFile(req.params.filename)'],
    ['VG-NODE-007', 'fetch(req.body.url)'],
    ['VG-NODE-007', 'axios.get(req.query["target"])'],
  ])('detects %s in %s', (ruleId, source) => {
    expect(matches(ruleId, source)).toHaveLength(1);
  });

  it.each([
    ['VG-NODE-006', 'fs.readFile(path.join(UPLOAD_DIR, safeName), callback)'],
    ['VG-NODE-007', 'fetch("https://api.example.com/health")'],
  ])('does not flag a fixed or validated sink for %s', (ruleId, source) => {
    expect(matches(ruleId, source)).toHaveLength(0);
  });
});
