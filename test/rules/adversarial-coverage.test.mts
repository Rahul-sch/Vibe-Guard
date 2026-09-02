import { describe, expect, it } from 'vitest';
import { allRules } from '../../src/rules/index.js';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('adversarial rule coverage', () => {
  it('separates dynamic execution, concatenated SQL, and secret placeholders', () => {
    expectMatches('VG-SEC-001', 'const result = eval (payload)');
    expectNoMatch('VG-SEC-001', 'const evaluator = buildEvaluator(payload)');
    expectMatches('VG-SEC-002', 'const sql = `SELECT * FROM users WHERE id = ${userId}`');
    expectNoMatch('VG-SEC-002', 'const sql = "SELECT * FROM users WHERE id = ?"');
    expectMatches('VG-SEC-003', "auth_token = 'Abcdefgh12345678'");
    expectNoMatch('VG-SEC-003', "auth_token = 'changeme'");
  });
  it('distinguishes secret logging and response exposure from safe fields', () => {
    expectMatches('VG-SEC-004', 'print(api_key)');
    expectNoMatch('VG-SEC-004', 'print(request_id)');
    expectMatches('VG-SEC-005', 'return { private_key: keyMaterial }');
    expectNoMatch('VG-SEC-005', 'return { public_key: publicKey }');
  });
  it('checks cloud credential lengths and GCP account types', () => {
    expectMatches('VG-SEC-006', 'AKIAABCDEFGHIJKLMNOP');
    expectNoMatch('VG-SEC-006', 'ASIAABCDEFGHIJKLMNOP');
    expectMatches('VG-SEC-007', `AWS_SECRET_ACCESS_KEY = '${'z'.repeat(40)}'`);
    expectNoMatch('VG-SEC-007', `AWS_SECRET_ACCESS_KEY = '${'z'.repeat(39)}'`);
    expectMatches('VG-SEC-008', '"type" : "service_account"');
    expectNoMatch('VG-SEC-008', '"type" : "authorized_user"');
  });
  it('checks Azure key length and supported private key headers', () => {
    expectMatches('VG-SEC-009', `AccountKey=${'A'.repeat(88)}==`);
    expectNoMatch('VG-SEC-009', `AccountKey=${'A'.repeat(87)}==`);
    expectMatches('VG-SEC-010', '-----BEGIN OPENSSH PRIVATE KEY-----');
    expectMatches('VG-SEC-010', '-----BEGIN EC PRIVATE KEY-----');
    expectNoMatch('VG-SEC-010', '-----BEGIN CERTIFICATE-----');
  });
  it('checks service-token prefixes and minimum lengths', () => {
    expectMatches('VG-SEC-011', `pk_test_${'B'.repeat(24)}`);
    expectNoMatch('VG-SEC-011', `pk_test_${'B'.repeat(23)}`);
    expectMatches('VG-SEC-012', `gho_${'c'.repeat(36)}`);
    expectNoMatch('VG-SEC-012', `glpat-${'c'.repeat(36)}`);
    expectMatches('VG-SEC-013', `https://hooks.slack.com/services/${'A'.repeat(9)}/${'B'.repeat(9)}/${'c'.repeat(24)}`);
    expectNoMatch('VG-SEC-013', 'https://hooks.slack.com/workflows/example');
  });
  it('checks JWT and generic API-key naming variants', () => {
    expectMatches('VG-SEC-014', "JWT-SECRET: '12345678'");
    expectNoMatch('VG-SEC-014', "jwt_secret = '1234567'");
    expectMatches('VG-SEC-015', `api-key = '${'D'.repeat(20)}'`);
    expectNoMatch('VG-SEC-015', `api-key = '${'D'.repeat(19)}'`);
  });
  it('checks Python shell execution and safe YAML loader boundaries', () => {
    expectMatches('VG-PY-001', 'subprocess.check_output(cmd, shell = True)');
    expectNoMatch('VG-PY-001', 'subprocess.check_output(args, shell = False)');
    expectMatches('VG-PY-002', 'os.system (command)');
    expectNoMatch('VG-PY-002', 'os.path.exists(command)');
    expectMatches('VG-PY-003', 'yaml.load(payload)');
    expectNoMatch('VG-PY-003', 'yaml.load(payload, Loader=yaml.SafeLoader)');
  });
  it('checks pickle, Flask debug, and TLS verification variants', () => {
    expectMatches('VG-PY-004', 'pickle.load(stream)');
    expectNoMatch('VG-PY-004', 'json.load(stream)');
    expectMatches('VG-PY-005', 'app.run(host="localhost", debug = True)');
    expectNoMatch('VG-PY-005', 'app.run(debug=False)');
    expectMatches('VG-PY-006', 'requests.patch(url, timeout=3, verify = False)');
    expectNoMatch('VG-PY-006', 'requests.patch(url, verify=True)');
  });
  it('checks Python file and outbound URL request-source variants', () => {
    expectMatches('VG-PY-007', 'Path( request.values["filename"] )');
    expectNoMatch('VG-PY-007', 'Path(settings.UPLOAD_ROOT)');
    expectMatches('VG-PY-008', 'httpx.request(request.form.get("url"))');
    expectNoMatch('VG-PY-008', 'httpx.request(settings.API_URL)');
  });
  it('checks Python SQL and Jinja request-source variants', () => {
    expectMatches('VG-PY-009', 'cursor.executemany( request.values.get("query") )');
    expectNoMatch('VG-PY-009', 'cursor.executemany(statement, rows)');
    expectMatches('VG-PY-010', 'Environment().from_string(request.POST.get("template"))');
    expectNoMatch('VG-PY-010', 'Environment().from_string(TRUSTED_TEMPLATE)');
  });
  it('checks Python evaluation, redirect, and archive variants', () => {
    expectMatches('VG-PY-011', 'compile(request.form["code"], "input", "exec")');
    expectNoMatch('VG-PY-011', 'compile(trusted_code, "input", "exec")');
    expectMatches('VG-PY-012', 'HttpResponsePermanentRedirect(request.POST.get("next"))');
    expectNoMatch('VG-PY-012', 'HttpResponsePermanentRedirect("/home")');
    expectMatches('VG-PY-013', 'bundle.extractall(path = request.values["target"])');
    expectNoMatch('VG-PY-013', 'bundle.extractall(path=SAFE_DIR)');
  });
  it('checks Python mutation and response-header syntax variants', () => {
    expectMatches('VG-PY-014', 'shutil.rmtree( request.GET.get("directory") )');
    expectNoMatch('VG-PY-014', 'shutil.rmtree(verified_directory)');
    expectMatches('VG-PY-015', 'response.headers ["Location"] = request.values.get("next")');
    expectNoMatch('VG-PY-015', 'response.headers["Location"] = safe_location');
  });
  it('checks Python import, regex, and subprocess syntax variants', () => {
    expectMatches('VG-PY-016', '__import__ ( request.GET.get("module") )');
    expectNoMatch('VG-PY-016', '__import__(approved_module)');
    expectMatches('VG-PY-017', 're.compile ( request.values.get("regex") )');
    expectNoMatch('VG-PY-017', 're.compile(re.escape(term))');
    expectMatches('VG-PY-018', 'subprocess.check_call( request.POST.get("command") )');
    expectNoMatch('VG-PY-018', 'subprocess.check_call([APPROVED_COMMAND])');
  });
  it('checks Node shell, spawn, and React HTML syntax variants', () => {
    expectMatches('VG-NODE-001', 'child_process.execSync(command)');
    expectNoMatch('VG-NODE-001', 'child_process.execFileSync(binary, args)');
    expectMatches('VG-NODE-002', 'spawn("tool", args, { cwd, shell: true })');
    expectNoMatch('VG-NODE-002', 'spawn("tool", args, { shell: false })');
    expectMatches('VG-NODE-003', '<div dangerouslySetInnerHTML = { { __html: content } } />');
    expectNoMatch('VG-NODE-003', '<div>{content}</div>');
  });
  it('checks Node local and global TLS bypass variants', () => {
    expectMatches('VG-NODE-004', 'const options = { rejectUnauthorized : false }');
    expectNoMatch('VG-NODE-004', 'const options = { rejectUnauthorized: true }');
    expectMatches('VG-NODE-005', "process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'");
    expectNoMatch('VG-NODE-005', "process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'");
  });
  it('checks Node file-read and outbound-request method variants', () => {
    expectMatches('VG-NODE-006', "createReadStream( request.params['asset'] )");
    expectNoMatch('VG-NODE-006', 'createReadStream(approvedAsset)');
    expectMatches('VG-NODE-007', 'axios.request( request.body.endpoint )');
    expectNoMatch('VG-NODE-007', 'axios.request(serviceEndpoint)');
  });
  it('checks Node database and module-loading request variants', () => {
    expectMatches('VG-NODE-008', 'records.deleteMany( request.query )');
    expectNoMatch('VG-NODE-008', 'records.deleteMany(authorizedFilter)');
    expectMatches('VG-NODE-009', 'import ( request.params.plugin )');
    expectNoMatch('VG-NODE-009', 'import(plugins[approvedName])');
  });
  it('checks Node write-path and response-header request variants', () => {
    expectMatches('VG-NODE-010', 'createWriteStream( request.body.output )');
    expectNoMatch('VG-NODE-010', 'createWriteStream(serverGeneratedPath)');
    expectMatches('VG-NODE-011', "setHeader( 'X-Trace', request.headers['x-trace'] )");
    expectNoMatch('VG-NODE-011', "setHeader('X-Trace', validatedTrace)");
  });
  it('checks Node static-root, redirect, and SQL boundaries', () => {
    expectMatches('VG-NODE-012', "express.static( '/' )");
    expectNoMatch('VG-NODE-012', "express.static('/srv/public')");
    expectMatches('VG-NODE-013', 'redirect ( request.params.returnTo )');
    expectNoMatch('VG-NODE-013', 'redirect(approvedReturnTo)');
    expectMatches('VG-NODE-014', 'database.execute( request.query.statement )');
    expectNoMatch('VG-NODE-014', 'database.execute(PREPARED_QUERY, values)');
  });
  it('checks Node template, regex, and executable selection variants', () => {
    expectMatches('VG-NODE-015', 'Handlebars.compile( request.body.source )');
    expectNoMatch('VG-NODE-015', 'Handlebars.compile(TRUSTED_SOURCE)');
    expectMatches('VG-NODE-016', 'new RegExp ( request.params.filter )');
    expectNoMatch('VG-NODE-016', 'new RegExp(escapedFilter)');
    expectMatches('VG-NODE-017', 'child_process.execFileSync( request.query.tool, args )');
    expectNoMatch('VG-NODE-017', 'child_process.execFileSync(APPROVED_TOOL, args)');
  });
});
