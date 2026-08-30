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

  it('detects Node request data used directly as a redirect target', () => {
    expect(matches('VG-NODE-013', 'res.redirect(req.query.next)')).toHaveLength(1);
    expect(matches('VG-NODE-013', "redirect(request.body['returnTo'])")).toHaveLength(1);
    expect(matches('VG-NODE-013', "res.redirect('/dashboard')")).toHaveLength(0);
  });

  it('detects Node request data executed directly as SQL', () => {
    expect(matches('VG-NODE-014', 'db.query(req.body.sql)')).toHaveLength(1);
    expect(matches('VG-NODE-014', "connection.execute(request.query['statement'])")).toHaveLength(1);
    expect(matches('VG-NODE-014', "db.query('SELECT * FROM users WHERE id = ?', [userId])")).toHaveLength(0);
  });

  it('detects Node request data compiled as a server-side template', () => {
    expect(matches('VG-NODE-015', 'ejs.compile(req.body.template)')).toHaveLength(1);
    expect(matches('VG-NODE-015', "Handlebars.compile(request.query['source'])")).toHaveLength(1);
    expect(matches('VG-NODE-015', 'pug.compile(trustedTemplate)')).toHaveLength(0);
  });

  it('detects Node request data compiled as a regular expression', () => {
    expect(matches('VG-NODE-016', 'new RegExp(req.query.pattern)')).toHaveLength(1);
    expect(matches('VG-NODE-016', "new RegExp(request.body['search'], 'i')")).toHaveLength(1);
    expect(matches('VG-NODE-016', "new RegExp('^[a-z]+$')")).toHaveLength(0);
  });

  it('detects Node request data used as a process executable', () => {
    expect(matches('VG-NODE-017', 'spawn(req.body.command, args)')).toHaveLength(1);
    expect(matches('VG-NODE-017', "child_process.execFile(request.query['binary'], args)")).toHaveLength(1);
    expect(matches('VG-NODE-017', "spawn('/usr/bin/convert', validatedArgs)")).toHaveLength(0);
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

  it('detects request data used directly as a redirect target', () => {
    expect(matches('VG-PY-012', 'redirect(request.args.get("next"))')).toHaveLength(1);
    expect(matches('VG-PY-012', 'HttpResponseRedirect(request.GET["return_to"])')).toHaveLength(1);
    expect(matches('VG-PY-012', 'redirect(url_for("dashboard"))')).toHaveLength(0);
  });

  it('detects request data used as an archive extraction path', () => {
    expect(matches('VG-PY-013', 'archive.extractall(request.args.get("destination"))')).toHaveLength(1);
    expect(matches('VG-PY-013', 'tar.extractall(path=request.POST["output"])')).toHaveLength(1);
    expect(matches('VG-PY-013', 'archive.extractall(SAFE_EXTRACTION_DIR)')).toHaveLength(0);
  });

  it('detects Python request data used as a file mutation path', () => {
    expect(matches('VG-PY-014', 'os.remove(request.args.get("path"))')).toHaveLength(1);
    expect(matches('VG-PY-014', 'shutil.rmtree(request.POST["directory"])')).toHaveLength(1);
    expect(matches('VG-PY-014', 'os.remove(validated_path)')).toHaveLength(0);
  });

  it('detects Python request data copied into response headers', () => {
    expect(matches('VG-PY-015', 'response.headers["X-Trace"] = request.args.get("trace")')).toHaveLength(1);
    expect(matches('VG-PY-015', 'response["Location"] = request.GET["next"]')).toHaveLength(1);
    expect(matches('VG-PY-015', 'response.headers["X-Frame-Options"] = "DENY"')).toHaveLength(0);
  });

  it('detects Python request data used as a module name', () => {
    expect(matches('VG-PY-016', 'importlib.import_module(request.args.get("plugin"))')).toHaveLength(1);
    expect(matches('VG-PY-016', '__import__(request.POST["module"])')).toHaveLength(1);
    expect(matches('VG-PY-016', 'importlib.import_module(ALLOWED_PLUGINS[name])')).toHaveLength(0);
  });

  it('detects Python request data compiled as a regular expression', () => {
    expect(matches('VG-PY-017', 're.compile(request.args.get("pattern"))')).toHaveLength(1);
    expect(matches('VG-PY-017', 're.compile(request.POST["search"], re.I)')).toHaveLength(1);
    expect(matches('VG-PY-017', 're.compile(r"^[a-z]+$")')).toHaveLength(0);
  });

  it('detects Python request data used as a process command', () => {
    expect(matches('VG-PY-018', 'subprocess.run(request.args.get("command"))')).toHaveLength(1);
    expect(matches('VG-PY-018', 'subprocess.Popen(request.POST["executable"])')).toHaveLength(1);
    expect(matches('VG-PY-018', 'subprocess.run(["/usr/bin/convert", validated_file])')).toHaveLength(0);
  });
});
