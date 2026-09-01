import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('request sink syntax variants', () => {
  it('covers MongoDB write and bracket-property query inputs', () => {
    expectMatches('VG-NODE-008', "accounts.updateMany(req.body['filter'], update)");
    expectMatches('VG-NODE-008', 'accounts.findOneAndUpdate(request.params.selector, update)');
    expectNoMatch('VG-NODE-008', 'accounts.updateMany(validatedFilter, update)');
  });

  it('covers dynamic imports from params and bracket-property inputs', () => {
    expectMatches('VG-NODE-009', 'import(req.params.moduleName)');
    expectMatches('VG-NODE-009', "require(request.body['adapter'])");
    expectNoMatch('VG-NODE-009', "import('./adapters/safe.js')");
  });
});
