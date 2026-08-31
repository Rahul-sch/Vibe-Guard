import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('web response protection rules', () => {
  it('detects unsafe DOM, routes, headers, and reflected output', () => {
    expectMatches('VG-WEB-005', 'element.innerHTML = props.html');
    expectNoMatch('VG-WEB-005', 'element.textContent = props.html');
    expectMatches('VG-WEB-006', "app.post('/transfer', handler)");
    expectNoMatch('VG-WEB-006', "app.get('/health', handler)");
    expectMatches('VG-WEB-007', 'const app = express()');
    expectNoMatch('VG-WEB-007', 'const app = express(); app.use(helmet())');
    expectMatches('VG-WEB-008', 'res.send(req.query.message)');
    expectNoMatch('VG-WEB-008', "res.send('ok')");
  });
});
