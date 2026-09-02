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
  it('checks Docker file-scope and privilege boundaries', () => {
    expectMatches('VG-DOCK-001', 'FROM alpine:3.20\nRUN adduser app');
    expectNoMatch('VG-DOCK-001', 'FROM alpine:3.20\nUSER app');
    expectMatches('VG-DOCK-002', '/var/run/docker.sock:/run/host.sock:ro');
    expectNoMatch('VG-DOCK-002', '/run/containerd/containerd.sock:/run/service.sock');
    expectMatches('VG-DOCK-003', 'docker run --privileged image');
    expectNoMatch('VG-DOCK-003', 'privileged: false');
  });
  it('checks Kubernetes RBAC, IPv6, and pod-context boundaries', () => {
    expectMatches('VG-K8S-001', 'roleRef:\n  name: clusteradmin');
    expectNoMatch('VG-K8S-001', 'roleRef:\n  name: namespace-admin');
    expectMatches('VG-K8S-002', 'ipBlock:\n  cidr: ::/0');
    expectNoMatch('VG-K8S-002', 'ipBlock:\n  cidr: 2001:db8::/32');
    expectMatches('VG-K8S-003', 'securityContext:\n  readOnlyRootFilesystem: true');
    expectNoMatch('VG-K8S-003', 'securityContext:\n  runAsNonRoot: true');
  });
  it('checks exposed listeners and public bucket policy variants', () => {
    expectMatches('VG-CFG-001', 'host: "0.0.0.0"');
    expectNoMatch('VG-CFG-001', 'host: "127.0.0.1"');
    expectMatches('VG-CFG-002', '"Principal" : "*"');
    expectNoMatch('VG-CFG-002', '"Principal": { "AWS": roleArn }');
  });
  it('checks dependency-confusion prefixes without flagging neighbors', () => {
    expectMatches('VG-DEP-001', 'from enterprise_auth import login');
    expectMatches('VG-DEP-001', 'import langchainplus');
    expectNoMatch('VG-DEP-001', 'import enterprise');
    expectMatches('VG-DEP-002', "require('@enterprise/private-sdk')");
    expectMatches('VG-DEP-002', "import 'react-native-toolkit'");
    expectNoMatch('VG-DEP-002', "import '@enterprises/public-sdk'");
  });
  it('checks weak hash names and random-token data flow', () => {
    expectMatches('VG-CRYPTO-001', 'MD5 (payload)');
    expectNoMatch('VG-CRYPTO-001', 'hmacMd5CompatibilityLabel');
    expectMatches('VG-CRYPTO-002', 'sha1 (payload)');
    expectNoMatch('VG-CRYPTO-002', 'sha1DigestLabel');
    expectMatches('VG-CRYPTO-003', 'const value = Math.random() + "-token"');
    expectNoMatch('VG-CRYPTO-003', 'const token = crypto.randomBytes(32)');
  });
  it('checks hardcoded key, salt, and IV length boundaries', () => {
    expectMatches('VG-CRYPTO-004', `encrypt-key = '${'k'.repeat(16)}'`);
    expectNoMatch('VG-CRYPTO-004', `encrypt-key = '${'k'.repeat(15)}'`);
    expectMatches('VG-CRYPTO-005', "initialization_vector = '12345678'");
    expectNoMatch('VG-CRYPTO-005', "initialization_vector = '1234567'");
  });
  it('checks ECB algorithms and exact weak key sizes', () => {
    expectMatches('VG-CRYPTO-006', "mode = 'DES-ECB'");
    expectNoMatch('VG-CRYPTO-006', "mode = 'AES-GCM'");
    expectMatches('VG-CRYPTO-007', 'key_size = 512');
    expectMatches('VG-CRYPTO-007', 'modulusLength: 1024');
    expectNoMatch('VG-CRYPTO-007', 'modulusLength: 4096');
  });
  it('checks raw CORS headers and complete cookie protections', () => {
    expectMatches('VG-WEB-001', "'Access-Control-Allow-Origin': '*'");
    expectNoMatch('VG-WEB-001', "'Access-Control-Allow-Origin': 'https://app.example.com'");
    expectMatches('VG-WEB-002', "setHeader('Set-Cookie', 'sid=value; SameSite=Lax')");
    expectNoMatch('VG-WEB-002', "setHeader('Set-Cookie', 'sid=value; Secure; HttpOnly')");
  });
  it('checks assignment redirects and request templates', () => {
    expectMatches('VG-WEB-003', 'location = req.params.next');
    expectNoMatch('VG-WEB-003', 'location = approvedLocation');
    expectMatches('VG-WEB-004', 'const html = `<p>${request.POST.name}</p>`');
    expectNoMatch('VG-WEB-004', 'const html = `<p>${escapedName}</p>`');
  });
  it('checks DOM assignment and CSRF middleware boundaries', () => {
    expectMatches('VG-WEB-005', 'panel.innerHTML = state.preview');
    expectNoMatch('VG-WEB-005', 'panel.textContent = state.preview');
    expectMatches('VG-WEB-006', "app.put('/profile', updateProfile)");
    expectNoMatch('VG-WEB-006', "app.put('/profile', csrfProtection, updateProfile)");
  });
  it('checks Helmet presence and reflected response methods', () => {
    expectMatches('VG-WEB-007', 'const app = express()');
    expectNoMatch('VG-WEB-007', 'const app = express();\napp.use(helmet())');
    expectMatches('VG-WEB-008', 'res.end(request.GET.get("message"))');
    expectMatches('VG-WEB-008', 'res.write(req.headers["x-name"])');
    expectNoMatch('VG-WEB-008', 'res.end(escapedMessage)');
  });
  it('checks cloud ACL casing and exact IAM wildcard actions', () => {
    expectMatches('VG-CLOUD-001', "acl = 'public-read'");
    expectNoMatch('VG-CLOUD-001', "acl = 'authenticated-read'");
    expectMatches('VG-CLOUD-002', '"Action" : "*"');
    expectNoMatch('VG-CLOUD-002', '"Resource": "*"');
  });
  it('checks cloud CIDR forms and encryption boolean variants', () => {
    expectMatches('VG-CLOUD-003', "CidrIp: ['0.0.0.0/0']");
    expectNoMatch('VG-CLOUD-003', "CidrIp: ['10.20.0.0/16']");
    expectMatches('VG-CLOUD-004', 'encryption: no');
    expectMatches('VG-CLOUD-004', 'encrypted = False');
    expectNoMatch('VG-CLOUD-004', 'encrypted = true');
  });
  it('checks multiline RDS encryption configuration', () => {
    expectMatches('VG-CLOUD-005', 'resource "aws_db_instance" "db" {\n  engine = "postgres"\n}');
    expectNoMatch('VG-CLOUD-005', 'resource "aws_db_instance" "db" {\n  storage_encrypted = true\n}');
  });
  it('checks customer-managed KMS configuration boundaries', () => {
    expectMatches('VG-CLOUD-006', 'resource "aws_ebs_volume" "data" {\n  size = 100\n}');
    expectNoMatch('VG-CLOUD-006', 'resource "aws_ebs_volume" "data" {\n  kms_key_id = aws_kms_key.data.arn\n}');
  });
  it('checks Azure public access and hardcoded IP address boundaries', () => {
    expectMatches('VG-CLOUD-007', 'allow_blob_public_access = TRUE');
    expectNoMatch('VG-CLOUD-007', 'allow_blob_public_access = false');
    expectMatches('VG-GEN-001', "endpoint = '255.255.255.255'");
    expectNoMatch('VG-GEN-001', "endpoint = '999.999.999.999'");
  });
  it('checks environment debug modes and excessive permissions', () => {
    expectMatches('VG-GEN-002', 'NODE_ENV=development');
    expectMatches('VG-GEN-002', 'FLASK_DEBUG: 1');
    expectNoMatch('VG-GEN-002', 'NODE_ENV=production');
    expectMatches('VG-GEN-003', 'chmod 666 generated.txt');
    expectNoMatch('VG-GEN-003', 'chmod 600 generated.txt');
  });
});
