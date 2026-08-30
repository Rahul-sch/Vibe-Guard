import { describe, expect, it } from 'vitest';
import { matchRule } from '../../src/engine/matcher.js';
import { ruleById } from '../../src/rules/index.js';

function matches(ruleId: string, source: string) {
  const rule = ruleById.get(ruleId);
  if (!rule) throw new Error(`Missing rule ${ruleId}`);
  return matchRule(source, rule);
}

describe('expanded high-confidence security rules', () => {
  it('detects direct request objects used as MongoDB queries', () => {
    expect(matches('VG-NODE-008', 'users.find(req.query)')).toHaveLength(1);
    expect(matches('VG-NODE-008', 'users.findOne(request.body.filter)')).toHaveLength(1);
    expect(matches('VG-NODE-008', 'users.find({ id: validatedId })')).toHaveLength(0);
  });

  it('detects request data used as a module path', () => {
    expect(matches('VG-NODE-009', 'require(req.query.plugin)')).toHaveLength(1);
    expect(matches('VG-NODE-009', "import(request.body['module'])")).toHaveLength(1);
    expect(matches('VG-NODE-009', "require('./plugins/safe.js')")).toHaveLength(0);
  });

  it('detects request data used as a file mutation path', () => {
    expect(matches('VG-NODE-010', 'fs.writeFile(req.body.path, data, cb)')).toHaveLength(1);
    expect(matches('VG-NODE-010', 'unlinkSync(request.query["file"])')).toHaveLength(1);
    expect(matches('VG-NODE-010', 'fs.writeFile(safePath, data, cb)')).toHaveLength(0);
  });

  it('detects request data copied into response headers', () => {
    expect(matches('VG-NODE-011', "res.setHeader('Location', req.query.next)")).toHaveLength(1);
    expect(matches('VG-NODE-011', "res.append('X-Trace', request.headers['x-trace'])")).toHaveLength(1);
    expect(matches('VG-NODE-011', "res.setHeader('X-Frame-Options', 'DENY')")).toHaveLength(0);
  });

  it('detects the filesystem root exposed as static content', () => {
    expect(matches('VG-NODE-012', "app.use(express.static('/'))")).toHaveLength(1);
    expect(matches('VG-NODE-012', 'app.use(express.static("/*"))')).toHaveLength(1);
    expect(matches('VG-NODE-012', "app.use(express.static('public'))")).toHaveLength(0);
  });

  it('detects request data executed directly as SQL', () => {
    expect(matches('VG-PY-009', 'cursor.execute(request.args.get("sql"))')).toHaveLength(1);
    expect(matches('VG-PY-009', 'db.executemany(request.POST["query"])')).toHaveLength(1);
    expect(matches('VG-PY-009', 'cursor.execute("SELECT * FROM users WHERE id = %s", [user_id])')).toHaveLength(0);
  });

  it('detects request data compiled as a Jinja template', () => {
    expect(matches('VG-PY-010', 'render_template_string(request.args.get("template"))')).toHaveLength(1);
    expect(matches('VG-PY-010', 'jinja2.Template(request.form["content"])')).toHaveLength(1);
    expect(matches('VG-PY-010', 'render_template("profile.html", name=request.args.get("name"))')).toHaveLength(0);
  });

  it('detects request data evaluated as Python code', () => {
    expect(matches('VG-PY-011', 'eval(request.args.get("expression"))')).toHaveLength(1);
    expect(matches('VG-PY-011', 'exec(request.POST["code"])')).toHaveLength(1);
    expect(matches('VG-PY-011', 'ast.literal_eval(config_value)')).toHaveLength(0);
  });
});
