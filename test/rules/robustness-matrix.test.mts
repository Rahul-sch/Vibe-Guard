import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('rule robustness matrix', () => {
  it('recognizes secret variable aliases while preserving placeholders', () => {
    expectMatches('VG-SEC-003', "private-key: 'AbCd1234+/=='");
    expectMatches('VG-SEC-003', "passwd = 'correct-horse-1'");
    expectNoMatch('VG-SEC-003', "private-key: '<generated-value>'");
    expectNoMatch('VG-SEC-003', "passwd = 'dummy'");
  });
  it('checks exact cloud and source-control token formats', () => {
    expectMatches('VG-SEC-006', 'prefix-AKIA0000000000000000-suffix');
    expectNoMatch('VG-SEC-006', 'prefix-AKIA000000000000000-suffix');
    expectMatches('VG-SEC-012', `ghu_${'A_'.repeat(18)}`);
    expectNoMatch('VG-SEC-012', `ghs_${'A'.repeat(36)}`);
  });
  it('covers Node exec templates, concatenation, and safe executable APIs', () => {
    expectMatches('VG-NODE-001', 'exec(`convert ${filename}`)');
    expectMatches('VG-NODE-001', 'exec("convert " + filename)');
    expectMatches('VG-NODE-001', 'execSync(command)');
    expectNoMatch('VG-NODE-001', 'execFile("convert", [filename])');
  });
  it('covers spawn shell option placement and safe settings', () => {
    expectMatches('VG-NODE-002', "spawn(command, args, { cwd: '/tmp', shell: true })");
    expectMatches('VG-NODE-002', 'spawn(command, [], { shell:true, timeout: 1000 })');
    expectNoMatch('VG-NODE-002', 'spawn(command, args, { shell: false })');
    expectNoMatch('VG-NODE-002', 'spawn(command, args)');
  });
  it('covers every Node file-read sink and safe path construction', () => {
    for (const sink of ['readFile', 'readFileSync', 'createReadStream', 'sendFile']) {
      expectMatches('VG-NODE-006', `${sink}(req.body.path)`);
      expectNoMatch('VG-NODE-006', `${sink}(validatedPath)`);
    }
  });
  it('covers outbound HTTP clients and safe configured URLs', () => {
    for (const sink of ['fetch', 'got', 'http.get', 'https.request', 'undici.request', 'axios.patch']) {
      expectMatches('VG-NODE-007', `${sink}(request.query.url)`);
      expectNoMatch('VG-NODE-007', `${sink}(serviceUrl)`);
    }
  });
  it('covers MongoDB and file-mutation method families', () => {
    for (const method of ['find', 'findOne', 'deleteOne', 'deleteMany', 'updateOne', 'updateMany', 'findOneAndUpdate']) {
      expectMatches('VG-NODE-008', `collection.${method}(req.query)`);
    }
    for (const sink of ['writeFile', 'writeFileSync', 'createWriteStream', 'unlink', 'unlinkSync', 'rm', 'rmSync', 'rename', 'renameSync']) {
      expectMatches('VG-NODE-010', `${sink}(request.body.path)`);
      expectNoMatch('VG-NODE-010', `${sink}(validatedPath)`);
    }
  });
  it('covers response-header aliases and static-root quote variants', () => {
    for (const sink of ['setHeader', 'res.header', 'res.set', 'res.append']) {
      expectMatches('VG-NODE-011', `${sink}('X-Value', req.headers.value)`);
      expectNoMatch('VG-NODE-011', `${sink}('X-Value', safeValue)`);
    }
    expectMatches('VG-NODE-012', "express.static(\"/*\")");
    expectNoMatch('VG-NODE-012', "express.static(\"./public\")");
  });
  it('covers template engines and process-execution variants', () => {
    for (const engine of ['ejs.compile', 'pug.compile', 'Handlebars.compile', 'nunjucks.renderString']) {
      expectMatches('VG-NODE-015', `${engine}(req.body.template)`);
      expectNoMatch('VG-NODE-015', `${engine}(trustedTemplate)`);
    }
    for (const sink of ['spawn', 'spawnSync', 'execFile', 'execFileSync']) {
      expectMatches('VG-NODE-017', `${sink}(request.params.binary)`);
      expectNoMatch('VG-NODE-017', `${sink}(approvedBinary)`);
    }
  });
  it('covers Python subprocess shells and deserializer alternatives', () => {
    for (const call of ['run', 'call', 'check_output', 'Popen']) {
      expectMatches('VG-PY-001', `subprocess.${call}(command, shell=True)`);
      expectNoMatch('VG-PY-001', `subprocess.${call}(args, shell=False)`);
    }
    expectMatches('VG-PY-003', 'yaml.load(document, Loader=yaml.FullLoader)');
    expectNoMatch('VG-PY-003', 'yaml.load(document, Loader=yaml.SafeLoader)');
    expectMatches('VG-PY-004', 'pickle.loads(blob)');
    expectNoMatch('VG-PY-004', 'json.loads(blob)');
  });
  it('covers Python file and HTTP client method families', () => {
    for (const sink of ['open', 'send_file', 'Path']) {
      expectMatches('VG-PY-007', `${sink}(request.args.get("path"))`);
      expectNoMatch('VG-PY-007', `${sink}(validated_path)`);
    }
    for (const sink of ['requests.get', 'requests.post', 'requests.put', 'requests.patch', 'requests.delete', 'requests.head', 'httpx.request']) {
      expectMatches('VG-PY-008', `${sink}(request.values.get("url"))`);
      expectNoMatch('VG-PY-008', `${sink}(configured_url)`);
    }
  });
  it('covers Python SQL, template, and code evaluation alternatives', () => {
    expectMatches('VG-PY-009', 'cursor.execute(request.form.get("statement"))');
    expectMatches('VG-PY-009', 'cursor.executemany(request.POST["statement"])');
    for (const sink of ['render_template_string', 'jinja2.Template']) {
      expectMatches('VG-PY-010', `${sink}(request.args.get("source"))`);
      expectNoMatch('VG-PY-010', `${sink}(trusted_source)`);
    }
    for (const sink of ['eval', 'exec', 'compile']) {
      expectMatches('VG-PY-011', `${sink}(request.values.get("code"))`);
      expectNoMatch('VG-PY-011', `${sink}(trusted_code)`);
    }
  });
});
