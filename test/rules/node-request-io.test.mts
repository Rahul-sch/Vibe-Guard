import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('Node request-to-I/O rules', () => {
  it('detects request values used in files, URLs, queries, modules, and headers', () => {
    expectMatches('VG-NODE-006', 'readFile(req.query.path)');
    expectNoMatch('VG-NODE-006', 'readFile(safePath)');
    expectMatches('VG-NODE-007', 'fetch(req.body.url)');
    expectNoMatch('VG-NODE-007', "fetch('https://api.example.com')");
    expectMatches('VG-NODE-008', 'users.find(req.query)');
    expectNoMatch('VG-NODE-008', 'users.find({ id })');
    expectMatches('VG-NODE-009', 'require(req.body.plugin)');
    expectNoMatch('VG-NODE-009', "require('./plugin')");
    expectMatches('VG-NODE-010', 'unlink(req.query.path)');
    expectNoMatch('VG-NODE-010', 'unlink(safePath)');
    expectMatches('VG-NODE-011', "res.setHeader('Location', req.query.next)");
    expectNoMatch('VG-NODE-011', "res.setHeader('Location', '/home')");
  });
});
