import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('Python core security rules', () => {
  it('detects unsafe command execution and deserialization', () => {
    expectMatches('VG-PY-001', 'subprocess.run(command, shell=True)');
    expectNoMatch('VG-PY-001', 'subprocess.run([command], shell=False)');
    expectMatches('VG-PY-002', 'os.system(command)');
    expectNoMatch('VG-PY-002', 'subprocess.run([command])');
    expectMatches('VG-PY-003', 'yaml.load(payload)');
    expectNoMatch('VG-PY-003', 'yaml.safe_load(payload)');
    expectMatches('VG-PY-004', 'pickle.loads(payload)');
    expectNoMatch('VG-PY-004', 'json.loads(payload)');
  });

  it('detects Flask debug mode and disabled SSL verification', () => {
    expectMatches('VG-PY-005', 'app.run(debug=True)');
    expectNoMatch('VG-PY-005', 'app.run(debug=False)');
    expectMatches('VG-PY-006', 'requests.get(url, verify=False)');
    expectNoMatch('VG-PY-006', 'requests.get(url, verify=True)');
  });
});
