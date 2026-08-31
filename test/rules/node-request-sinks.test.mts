import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('Node request-to-execution rules', () => {
  it('detects request-controlled static paths, redirects, execution, templates, regexes, and processes', () => {
    expectMatches('VG-NODE-012', "express.static('/')");
    expectNoMatch('VG-NODE-012', "express.static('public')");
    expectMatches('VG-NODE-013', 'res.redirect(req.query.next)');
    expectNoMatch('VG-NODE-013', "res.redirect('/home')");
    expectMatches('VG-NODE-014', 'db.query(req.body.sql)');
    expectNoMatch('VG-NODE-014', "db.query('SELECT 1')");
    expectMatches('VG-NODE-015', 'ejs.compile(req.body.template)');
    expectNoMatch('VG-NODE-015', 'ejs.compile(template)');
    expectMatches('VG-NODE-016', 'new RegExp(req.query.pattern)');
    expectNoMatch('VG-NODE-016', "new RegExp('safe')");
    expectMatches('VG-NODE-017', 'spawn(req.body.command)');
    expectNoMatch('VG-NODE-017', "spawn('convert', args)");
  });
});
