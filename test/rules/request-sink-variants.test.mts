import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('request sink syntax variants', () => {
  it('covers MongoDB write and bracket-property query inputs', () => {
    expectMatches('VG-NODE-008', "accounts.updateMany(req.body['filter'], update)");
    expectMatches('VG-NODE-008', 'accounts.findOneAndUpdate(request.params.selector, update)');
    expectNoMatch('VG-NODE-008', 'accounts.updateMany(validatedFilter, update)');
  });
});
