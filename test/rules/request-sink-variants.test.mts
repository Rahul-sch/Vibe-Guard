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

  it('covers rename and recursive removal request paths', () => {
    expectMatches('VG-NODE-010', 'fs.rename(req.params.source, safeTarget, callback)');
    expectMatches('VG-NODE-010', "rmSync(request.body['path'], { recursive: true })");
    expectNoMatch('VG-NODE-010', 'fs.rename(validatedSource, safeTarget, callback)');
  });

  it('covers Express header aliases and incoming header values', () => {
    expectMatches('VG-NODE-011', "res.header('X-User', req.headers['x-user'])");
    expectMatches('VG-NODE-011', "res.set('Location', request.query.next)");
    expectNoMatch('VG-NODE-011', "res.set('Cache-Control', 'no-store')");
  });

  it('covers filesystem-root static mounts with spacing variants', () => {
    expectMatches('VG-NODE-012', 'express.static( "/" )');
    expectMatches('VG-NODE-012', "express.static('/*')");
    expectNoMatch('VG-NODE-012', "express.static('/public')");
  });
});
