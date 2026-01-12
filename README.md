# VibeGuard

Regex-first security scanner for AI-generated ("vibe-coded") projects. Catches secrets, injections, crypto issues, cloud misconfigs, and more.

## Features

- **43+ detection rules** across 11 categories (secrets, injection, crypto, web, cloud, config, Python, Node.js, Docker, Kubernetes)
- **Fast regex scanning** - no AST parsing, works on any codebase size
- **Multiple output formats** - console (colored), JSON, SARIF, beautiful tables
- **Optional AI verification** - reduce false positives with LLM verification (BYOK)
- **Rule explanations** - `vibeguard --why VG-SEC-001` for detailed guidance
- **Benchmarking** - performance metrics with `--benchmark` flag
- **Auto-fix support** - automatically fix common issues with `vibeguard fix`
- **Zero config** - works out of the box with sensible defaults

## Installation

```bash
npm install -g vibeguard
```

## Quick Start

```bash
# Scan current directory
vibeguard

# Scan specific path
vibeguard ./src

# Show only critical issues
vibeguard --severity critical

# Output as JSON
vibeguard --json

# Output as beautiful table
vibeguard --table

# Explain a specific rule
vibeguard --why VG-SEC-001

# List all rules with descriptions
vibeguard --why

# Show performance metrics
vibeguard --benchmark

# Enable AI verification
vibeguard --ai --ai-key sk-xxx

# Auto-fix issues
vibeguard fix --dry-run
vibeguard fix --yes
```

## CLI Options

### Scan Command
| Option | Description |
|--------|-------------|
| `-s, --severity <level>` | Minimum severity: `critical`, `warning`, `info` (default: `warning`) |
| `-f, --format <type>` | Output format: `console`, `json`, `sarif` (default: `console`) |
| `--json` | Shorthand for `--format json` |
| `--sarif` | Shorthand for `--format sarif` |
| `--table` | Output results as formatted table with colors |
| `--benchmark` | Show scan performance metrics |
| `-i, --ignore <pattern>` | Additional ignore patterns (can repeat) |
| `--max-file-size <bytes>` | Skip files larger than this (default: 1MB) |
| `--no-color` | Disable colored output |
| `-v, --verbose` | Show debug information |
| `--ai` | Enable AI verification |
| `--ai-key <key>` | API key for AI provider |
| `--ai-provider <name>` | AI provider: `openai`, `anthropic`, `groq` |
| `-c, --config <path>` | Path to config file |

### Rule Explanation
| Option | Description |
|--------|-------------|
| `--why [rule-id]` | Explain a rule or list all rules with descriptions |

### Fix Command
| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without applying |
| `--yes` | Apply all fixes without confirmation |
| `--ai` | Use AI to generate fixes for non-regex-fixable issues |
| `--ai-key <key>` | API key for AI provider |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No issues found (or only info-level) |
| 1 | Warning-level issues found |
| 2 | Critical-level issues found |

## Detection Rules (43+ Rules)

### Secrets & Credentials (15 rules)
- `VG-SEC-001` - Dynamic code execution (eval)
- `VG-SEC-002` - SQL string concatenation
- `VG-SEC-003` - Hardcoded secrets/credentials
- `VG-SEC-004` - Secret logged to console
- `VG-SEC-005` - Secret in API response
- `VG-SEC-006` - AWS Access Key ID
- `VG-SEC-007` - AWS Secret Key
- `VG-SEC-008` - GCP Service Account Key
- `VG-SEC-009` - Azure Connection String
- `VG-SEC-010` - Private Key in Code (RSA/EC/OpenSSH)
- `VG-SEC-011` - Stripe API Key
- `VG-SEC-012` - GitHub Token
- `VG-SEC-013` - Slack Webhook URL
- `VG-SEC-014` - JWT Secret
- `VG-SEC-015` - Generic API Key Pattern

### Python (6 rules)
- `VG-PY-001` - Shell command exec (shell=True)
- `VG-PY-002` - OS system call
- `VG-PY-003` - Unsafe YAML load
- `VG-PY-004` - Insecure pickle deserialization
- `VG-PY-005` - Flask debug mode enabled
- `VG-PY-006` - Disabled SSL verification

### Node.js (5 rules)
- `VG-NODE-001` - Child process exec
- `VG-NODE-002` - Spawn with shell
- `VG-NODE-003` - Unsafe HTML rendering (React)
- `VG-NODE-004` - Disabled TLS verification
- `VG-NODE-005` - TLS reject env bypass

### Cryptography (7 rules)
- `VG-CRYPTO-001` - Weak Hash Algorithm (MD5)
- `VG-CRYPTO-002` - Weak Hash Algorithm (SHA1)
- `VG-CRYPTO-003` - Insecure Random for Crypto
- `VG-CRYPTO-004` - Hardcoded Encryption Key
- `VG-CRYPTO-005` - Hardcoded Salt/IV
- `VG-CRYPTO-006` - ECB Mode Usage
- `VG-CRYPTO-007` - Weak Key Size

### Web Security (7 rules)
- `VG-WEB-001` - CORS Wildcard Origin
- `VG-WEB-002` - Insecure Cookie (missing Secure/HttpOnly)
- `VG-WEB-003` - Open Redirect
- `VG-WEB-004` - XSS in Template
- `VG-WEB-005` - innerHTML with User Input
- `VG-WEB-006` - Missing CSRF Protection
- `VG-WEB-007` - Missing Security Headers

### Cloud Infrastructure (7 rules)
- `VG-CLOUD-001` - S3 Bucket Public Read
- `VG-CLOUD-002` - IAM Wildcard Permissions
- `VG-CLOUD-003` - Security Group Open to World (0.0.0.0/0)
- `VG-CLOUD-004` - Unencrypted Storage
- `VG-CLOUD-005` - RDS Without Encryption
- `VG-CLOUD-006` - Missing KMS Encryption
- `VG-CLOUD-007` - Azure Storage Public Access

### General Security (6 rules)
- `VG-GEN-001` - Hardcoded IP Address
- `VG-GEN-002` - Debug Mode in Production
- `VG-GEN-003` - Excessive File Permissions (777/666)
- `VG-GEN-004` - Commented Credentials
- `VG-GEN-005` - Hardcoded Database Host
- `VG-GEN-006` - TODO Security Note

### Docker (3 rules)
- `VG-DOCK-001` - Container running as root
- `VG-DOCK-002` - Docker socket exposed
- `VG-DOCK-003` - Privileged container

### Kubernetes (3 rules)
- `VG-K8S-001` - Cluster-admin role binding
- `VG-K8S-002` - Open ingress rules (0.0.0.0/0)
- `VG-K8S-003` - Missing runAsNonRoot

### Configuration (2 rules)
- `VG-CFG-001` - Service bound to 0.0.0.0
- `VG-CFG-002` - Public S3 bucket ACL

**Run `vibeguard --why` to see all rules with detailed explanations and examples!**

## GitHub Actions

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  vibeguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install VibeGuard
        run: npm install -g vibeguard

      - name: Run security scan
        run: vibeguard --sarif > results.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

## Configuration File

Create `vibeguard.config.json` in your project root:

```json
{
  "severity": "warning",
  "ignore": ["**/test/**", "**/fixtures/**"],
  "format": "console"
}
```

## AI Verification

VibeGuard supports optional AI verification to reduce false positives. Set your API key:

```bash
export VIBEGUARD_AI_KEY=sk-xxx
vibeguard --ai
```

Supported providers:
- OpenAI (default)
- Anthropic (`sk-ant-*` keys auto-detected)
- Groq (`gsk_*` keys auto-detected)

## Examples

### Table Output
```bash
$ vibeguard --table

┌────────────────────────────────────────────────────────────────┐
│                  VibeGuard Security Scan Results              │
├──────────────┬──────────┬──────────────────────────────────────┤
│ Rule ID      │ Severity │ Message                              │
├──────────────┼──────────┼──────────────────────────────────────┤
│ VG-SEC-003   │ CRITICAL │ Hardcoded secret detected            │
│ VG-SEC-002   │ CRITICAL │ SQL injection vulnerability          │
│ VG-WEB-001   │ WARNING  │ CORS allows all origins              │
│ VG-CRYPTO-001│ WARNING  │ Weak hash algorithm (MD5)            │
└──────────────┴──────────┴──────────────────────────────────────┘
```

### Rule Explanations
```bash
$ vibeguard --why VG-SEC-002

═══ VG-SEC-002: SQL String Concatenation ═══

Category: secrets
Severity: critical
CWE: CWE-89

What it detects:
Building SQL queries with string concatenation enables SQL injection attacks.

Why this matters:
Attackers can inject malicious SQL code to read, modify, or delete data.

Example:
// BAD
const query = "SELECT * FROM users WHERE email = '" + userEmail + "'";

// GOOD
const query = "SELECT * FROM users WHERE email = ?";
db.query(query, [userEmail]);

How to fix:
Use parameterized queries (prepared statements) with placeholders.
```

### Performance Benchmarking
```bash
$ vibeguard --benchmark

[scan output]

⏱️  Performance Metrics:
   Scan time: 245ms
   Files scanned: 342
   Rules evaluated: 43
   Findings: 8
   Speed: 1,396 files/sec
```

### Auto-fix Preview
```bash
$ vibeguard fix --dry-run

Found 5 auto-fixable issues:

1. src/auth.js:42 - Hardcoded API secret
   - Replace with: process.env.API_SECRET
   [Apply] [Skip]

2. src/db.ts:18 - SQL concatenation
   - Replace with: Parameterized query
   [Apply] [Skip]

Apply these fixes? (y/n) n
```

## License

MIT
