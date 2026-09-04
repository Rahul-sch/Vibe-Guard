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
  it('covers Python redirects, archive extraction, and deletion families', () => {
    for (const sink of ['redirect', 'HttpResponseRedirect', 'HttpResponsePermanentRedirect']) {
      expectMatches('VG-PY-012', `${sink}(request.GET.get("next"))`);
      expectNoMatch('VG-PY-012', `${sink}(safe_next)`);
    }
    expectMatches('VG-PY-013', 'archive.extractall(request.form.get("target"))');
    expectNoMatch('VG-PY-013', 'archive.extractall(SAFE_TARGET)');
    for (const sink of ['remove', 'unlink', 'rmdir', 'os.remove', 'os.unlink', 'os.rmdir', 'shutil.rmtree']) {
      expectMatches('VG-PY-014', `${sink}(request.POST.get("path"))`);
      expectNoMatch('VG-PY-014', `${sink}(validated_path)`);
    }
  });
  it('covers Python headers, imports, regexes, and process helpers', () => {
    expectMatches('VG-PY-015', 'response["X-Value"] = request.headers.get("X-Value")');
    expectMatches('VG-PY-015', 'response.headers["X-Value"] = request.form["value"]');
    for (const sink of ['importlib.import_module', '__import__']) {
      expectMatches('VG-PY-016', `${sink}(request.args.get("module"))`);
      expectNoMatch('VG-PY-016', `${sink}(approved_module)`);
    }
    expectMatches('VG-PY-017', 're.compile(request.GET["pattern"])');
    for (const sink of ['subprocess.run', 'subprocess.call', 'subprocess.check_call', 'subprocess.check_output', 'subprocess.Popen']) {
      expectMatches('VG-PY-018', `${sink}(request.form.get("command"))`);
      expectNoMatch('VG-PY-018', `${sink}(approved_command)`);
    }
  });
  it('covers Docker and Kubernetes equivalent syntax forms', () => {
    expectMatches('VG-DOCK-002', '/var/run/docker.sock');
    expectMatches('VG-DOCK-003', 'privileged : true');
    expectMatches('VG-K8S-001', 'name: cluster-admin');
    expectMatches('VG-K8S-001', 'name: clusteradmin');
    expectMatches('VG-K8S-002', 'cidr: 0.0.0.0/0');
    expectMatches('VG-K8S-002', 'cidr: ::/0');
    expectNoMatch('VG-K8S-003', 'securityContext:\n  runAsNonRoot : true');
  });
  it('covers configuration and dependency naming variants', () => {
    expectMatches('VG-CFG-001', "server.listen(8080, '0.0.0.0')");
    expectNoMatch('VG-CFG-001', "server.listen(8080, '::1')");
    expectMatches('VG-CFG-002', 'ACL: public-read');
    expectMatches('VG-DEP-001', 'from flask_admin_tools import panel');
    expectMatches('VG-DEP-002', "import 'huggingface-utils'");
    expectNoMatch('VG-DEP-002', "import 'huggingface_hub'");
  });
  it('covers cryptography aliases, boundaries, and secure alternatives', () => {
    expectMatches('VG-CRYPTO-001', 'md5(data)');
    expectMatches('VG-CRYPTO-002', 'SHA1(data)');
    expectMatches('VG-CRYPTO-003', 'const nonce = Math.random() + nonceSuffix');
    expectMatches('VG-CRYPTO-004', `encryption_key = '${'x'.repeat(16)}'`);
    expectMatches('VG-CRYPTO-005', "salt = '12345678'");
    expectMatches('VG-CRYPTO-006', "algorithm = 'AES-ECB'");
    expectMatches('VG-CRYPTO-007', 'keySize: 512');
    expectNoMatch('VG-CRYPTO-007', 'keySize: 256');
  });
  it('covers web response methods and protected alternatives', () => {
    expectMatches('VG-WEB-001', "origin: '*' ");
    expectNoMatch('VG-WEB-002', "setCookie('sid', value, { secure: true, httpOnly: true })");
    expectMatches('VG-WEB-004', '`${req.params.name}`');
    expectMatches('VG-WEB-005', 'node.innerHTML = props.content');
    expectNoMatch('VG-WEB-006', "app.delete('/item', xsrfGuard, removeItem)");
    expectNoMatch('VG-WEB-007', 'express(); helmet()');
    for (const method of ['send', 'write', 'end']) {
      expectMatches('VG-WEB-008', `res.${method}(req.body.message)`);
      expectNoMatch('VG-WEB-008', `res.${method}(escapedMessage)`);
    }
  });
});
