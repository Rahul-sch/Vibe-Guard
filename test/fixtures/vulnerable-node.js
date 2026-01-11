// VG-NODE-001: child_process.exec
const { exec } = require('child_process');
exec(`rm -rf ${userInput}`);

// VG-NODE-002: spawn with shell
const { spawn } = require('child_process');
spawn('cmd', args, { shell: true });

// VG-NODE-003: dangerouslySetInnerHTML
function Component() {
  return <div dangerouslySetInnerHTML={{ __html: userContent }} />;
}

// VG-NODE-004: rejectUnauthorized
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

// VG-NODE-005: NODE_TLS env
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// VG-SEC-001: eval
const result = eval(userCode);

// VG-SEC-002: SQL concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;

// VG-SEC-003: hardcoded token
const token = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

// VG-SEC-004: logging secret
console.log("API key:", apiKey);
