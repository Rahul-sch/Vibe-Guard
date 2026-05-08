// Positive-test corpus: each line below MUST be flagged by at least one rule.
// Used by test/engine/coverage.test.mts to lock in detection coverage.

// VG-SEC-006 — AWS Access Key (literal, real shape)
const awsKey = "AKIAIOSFODNN7EXAMPLE";

// VG-SEC-003 — short hardcoded password (must catch even short-but-clearly-secret values)
const password = "supersecret123";

// VG-SEC-003 / VG-SEC-015 — generic api key
const apiKey = "sk-1234567890abcdef1234567890abcdef";

// VG-NODE-001 — exec with string concatenation (was previously only catching backtick form)
const { exec } = require('child_process');
exec("ls " + req.query.dir);

// VG-NODE-001 — exec with template-literal interpolation
exec(`cat ${req.params.path}`);

// VG-SEC-001 — eval
eval(req.body.code);

// VG-WEB-001 — CORS wildcard via express middleware (was previously only catching raw header form)
app.use(cors({ origin: '*' }));

// VG-SEC-002 — SQL string concatenation
const sqlQuery = "SELECT * FROM users WHERE id = " + userId;

// VG-WEB-008 — reflected XSS via res.send with raw req data
res.send(req.query.html);

// Negative cases — these MUST NOT be flagged by VG-SEC-003.
const example = "example";
const dummy = "test";
const placeholder = "your_api_key_here";
