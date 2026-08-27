import { describe, expect, it } from 'vitest';
import { matchRule } from '../../src/engine/matcher.js';
import { ruleById } from '../../src/rules/index.js';

function matches(ruleId: string, source: string) {
  const rule = ruleById.get(ruleId);
  if (!rule) throw new Error(`Missing rule ${ruleId}`);
  return matchRule(source, rule);
}

describe('Python request-to-sink rules', () => {
  it.each([
    ['VG-PY-007', 'open(request.args["filename"])'],
    ['VG-PY-007', 'send_file(request.form.get("path"))'],
    ['VG-PY-007', "open( request.values.get('archive') )"],
    ['VG-PY-008', 'requests.get(request.args.get("url"))'],
    ['VG-PY-008', 'requests.post(request.values["webhook"])'],
    ['VG-PY-008', "requests.delete( request.form['endpoint'] )"],
    ['VG-PY-008', 'requests.request(request.args.get("method"))'],
  ])('detects %s in %s', (ruleId, source) => {
    expect(matches(ruleId, source)).toHaveLength(1);
  });

  it.each([
    ['VG-PY-007', 'open(os.path.join(UPLOAD_DIR, safe_name))'],
    ['VG-PY-007', 'send_file(settings.EXPORT_PATH)'],
    ['VG-PY-008', 'requests.get("https://api.example.com/health")'],
    ['VG-PY-008', 'requests.post(settings.WEBHOOK_URL)'],
  ])('does not flag a fixed or validated sink for %s', (ruleId, source) => {
    expect(matches(ruleId, source)).toHaveLength(0);
  });
});
