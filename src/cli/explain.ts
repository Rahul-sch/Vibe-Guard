import chalk from 'chalk';
import { ruleById } from '../rules/index.js';

/**
 * Explain rule details with examples and remediation
 * Used by --why flag
 */

interface RuleExplanation {
  description: string;
  example: string;
  fix: string;
  impact: string;
}

const ruleExplanations: Record<string, RuleExplanation> = {
  'VG-SEC-001': {
    description: 'Dynamic code execution (eval) allows arbitrary code execution, making it extremely dangerous.',
    example: `// BAD
eval(userInput);
const fn = new Function(code);

// GOOD
JSON.parse(userInput);`,
    fix: 'Replace eval() with safer alternatives like JSON.parse() for data, or use a sandboxed VM if code execution is truly needed.',
    impact: 'Attackers can execute arbitrary code on your server/client, leading to complete system compromise.',
  },
  'VG-SEC-002': {
    description: 'Building SQL queries with string concatenation enables SQL injection attacks.',
    example: `// BAD
const query = "SELECT * FROM users WHERE email = '" + userEmail + "'";

// GOOD
const query = "SELECT * FROM users WHERE email = ?";
db.query(query, [userEmail]);`,
    fix: 'Use parameterized queries (prepared statements) with placeholders.',
    impact: 'Attackers can read, modify, or delete database data, or execute admin operations.',
  },
  'VG-SEC-003': {
    description: 'Hardcoded secrets in source code can be easily extracted by attackers.',
    example: `// BAD
const apiKey = "sk_live_abc123xyz";

// GOOD
const apiKey = process.env.API_KEY;`,
    fix: 'Move secrets to environment variables or secure secret management systems.',
    impact: 'Exposed secrets can be used to impersonate your application or access protected resources.',
  },
  'VG-SEC-006': {
    description: 'AWS Access Key IDs should never be committed to code repositories.',
    example: `// BAD
const accessKeyId = "AKIAIOSFODNN7EXAMPLE";

// GOOD
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;`,
    fix: 'Use IAM roles for EC2/Lambda, or environment variables. Rotate exposed keys immediately.',
    impact: 'Attackers gain full AWS account access, potentially incurring massive costs.',
  },
  'VG-PY-001': {
    description: 'Using shell=True with subprocess allows command injection vulnerabilities.',
    example: `# BAD
subprocess.run(f"ls {user_input}", shell=True)

# GOOD
subprocess.run(["ls", user_input], shell=False)`,
    fix: 'Set shell=False and pass commands as arrays, or use shlex.quote() if shell is required.',
    impact: 'Attackers can execute arbitrary shell commands on your server.',
  },
  'VG-NODE-001': {
    description: 'Using child_process.exec with user input allows command injection.',
    example: `// BAD
exec(\`ping \${userInput}\`);

// GOOD
execFile('ping', [userInput]);`,
    fix: 'Use execFile() or spawn() with argument arrays instead of exec().',
    impact: 'Attackers can execute arbitrary commands, potentially taking over the system.',
  },
  'VG-CRYPTO-001': {
    description: 'MD5 is cryptographically broken and should not be used for security purposes.',
    example: `// BAD
const hash = crypto.createHash('md5');

// GOOD
const hash = crypto.createHash('sha256');`,
    fix: 'Use SHA-256, SHA-3, or bcrypt/scrypt for passwords.',
    impact: 'Attackers can forge hashes or crack passwords using known MD5 vulnerabilities.',
  },
  'VG-WEB-001': {
    description: 'CORS wildcard origin (*) exposes your API to requests from any origin.',
    example: `// BAD
res.setHeader('Access-Control-Allow-Origin', '*');

// GOOD
const allowedOrigins = ['https://yourdomain.com'];
if (allowedOrigins.includes(req.headers.origin)) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
}`,
    fix: 'Whitelist specific trusted origins, or use credentials: false.',
    impact: 'Malicious sites can make authenticated requests to your API, stealing user data.',
  },
};

export function explainRule(ruleId: string): string {
  const rule = ruleById.get(ruleId);
  if (!rule) {
    return chalk.red(`Rule ${ruleId} not found`);
  }

  const explanation = ruleExplanations[ruleId];
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold.cyan(`═══ ${ruleId}: ${rule.title} ═══`));
  lines.push('');

  // Basic info
  lines.push(chalk.bold('Category: ') + chalk.yellow(rule.category));
  lines.push(chalk.bold('Severity: ') + (rule.severity === 'critical' ? chalk.red(rule.severity) : chalk.yellow(rule.severity)));
  lines.push(chalk.bold('CWE: ') + chalk.gray(rule.cwe || 'N/A'));
  lines.push('');

  // Rule message
  lines.push(chalk.bold('What it detects:'));
  lines.push(chalk.white(rule.message));
  lines.push('');

  // Detailed explanation (if available)
  if (explanation) {
    lines.push(chalk.bold('Why this matters:'));
    lines.push(chalk.white(explanation.description));
    lines.push('');

    lines.push(chalk.bold('Example:'));
    lines.push(explanation.example);
    lines.push('');

    lines.push(chalk.bold('How to fix:'));
    lines.push(chalk.green(explanation.fix));
    lines.push('');

    lines.push(chalk.bold('Security impact:'));
    lines.push(chalk.red(explanation.impact));
    lines.push('');
  }

  // Remediation
  if (rule.remediation) {
    lines.push(chalk.bold('Recommended action:'));
    lines.push(chalk.green('→ ' + rule.remediation));
    lines.push('');
  }

  // Fixable status
  if (rule.fixable) {
    lines.push(chalk.green('✓ This issue can be auto-fixed with: ') + chalk.cyan('vibeguard fix'));
  } else {
    lines.push(chalk.yellow('⚠ Manual fix required'));
  }

  lines.push('');
  return lines.join('\n');
}

export function explainAllRules(): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(chalk.bold.cyan('═══ All VibeGuard Rules ═══'));
  lines.push('');

  const categories = new Map<string, string[]>();
  for (const [id, rule] of ruleById) {
    const category = rule.category;
    const existing = categories.get(category) || [];
    existing.push(id);
    categories.set(category, existing);
  }

  for (const [category, ruleIds] of categories) {
    lines.push(chalk.bold.yellow(`${category.toUpperCase()}:`));
    for (const id of ruleIds.sort()) {
      const rule = ruleById.get(id)!;
      const severity = rule.severity === 'critical' ? chalk.red('■') : chalk.yellow('▲');
      lines.push(`  ${severity} ${chalk.cyan(id)} - ${rule.title}`);
    }
    lines.push('');
  }

  lines.push(chalk.gray(`Total: ${ruleById.size} rules`));
  lines.push('');
  lines.push(chalk.white('Use ') + chalk.cyan('vibeguard --why <rule-id>') + chalk.white(' for detailed explanation'));
  lines.push('');

  return lines.join('\n');
}
