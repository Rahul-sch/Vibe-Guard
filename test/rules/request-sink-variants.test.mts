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

  it('covers redirect params and bracket-property targets', () => {
    expectMatches('VG-NODE-013', 'res.redirect(req.params.destination)');
    expectMatches('VG-NODE-013', "redirect(request.query['continue'])");
    expectNoMatch('VG-NODE-013', 'res.redirect(allowedDestinations[name])');
  });

  it('covers SQL execute and params-based statements', () => {
    expectMatches('VG-NODE-014', 'connection.execute(req.params.statement)');
    expectMatches('VG-NODE-014', "pool.query(request.body['sql'])");
    expectNoMatch('VG-NODE-014', 'connection.execute(preparedStatement, values)');
  });

  it('covers alternate server-side template engines', () => {
    expectMatches('VG-NODE-015', 'nunjucks.renderString(req.body.source, context)');
    expectMatches('VG-NODE-015', "pug.compile(request.params['template'])");
    expectNoMatch('VG-NODE-015', 'nunjucks.renderString(trustedSource, context)');
  });

  it('covers regular expressions from params and bracket properties', () => {
    expectMatches('VG-NODE-016', 'new RegExp(req.params.pattern, "i")');
    expectMatches('VG-NODE-016', "new RegExp(request.query['filter'])");
    expectNoMatch('VG-NODE-016', 'new RegExp(escapedPattern)');
  });
});
