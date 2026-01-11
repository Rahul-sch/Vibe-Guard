# VibeGuard

Regex-first security scanner for AI-generated ("vibe-coded") projects.

## Features

- **23 detection rules** covering secrets, injection, Docker, Kubernetes, Python, Node.js
- **Fast regex scanning** - no AST parsing, works on any codebase size
- **Multiple output formats** - console (colored), JSON, SARIF (GitHub Code Scanning)
- **Optional AI verification** - reduce false positives with LLM verification (BYOK)
- **Zero config** - works out of the box with sensible defaults

## Installation

```bash
npm install -g vibeguard
```

## Usage

```bash
# Scan current directory
vibeguard

# Scan specific path
vibeguard ./src

# Show only critical issues
vibeguard --severity critical

# Output as JSON
vibeguard --json

# Output as SARIF (for GitHub Code Scanning)
vibeguard --sarif > report.sarif

# Enable AI verification
vibeguard --ai --ai-key sk-xxx
```

## CLI Options

| Option | Description |
|--------|-------------|
| `-s, --severity <level>` | Minimum severity: `critical`, `warning`, `info` (default: `warning`) |
| `-f, --format <type>` | Output format: `console`, `json`, `sarif` (default: `console`) |
| `--json` | Shorthand for `--format json` |
| `--sarif` | Shorthand for `--format sarif` |
| `-i, --ignore <pattern>` | Additional ignore patterns (can repeat) |
| `--max-file-size <bytes>` | Skip files larger than this (default: 1MB) |
| `--no-color` | Disable colored output |
| `-v, --verbose` | Show debug information |
| `--ai` | Enable AI verification |
| `--ai-key <key>` | API key for AI provider |
| `--ai-provider <name>` | AI provider: `openai`, `anthropic`, `groq` |
| `-c, --config <path>` | Path to config file |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No issues found (or only info-level) |
| 1 | Warning-level issues found |
| 2 | Critical-level issues found |

## Detection Rules

### Secrets & Injection
- `VG-SEC-001` - Dynamic code execution (eval)
- `VG-SEC-002` - SQL string concatenation
- `VG-SEC-003` - Hardcoded secrets/credentials
- `VG-SEC-004` - Secret logged to console
- `VG-SEC-005` - Secret in API response

### Python
- `VG-PY-001` - Shell command exec (shell=True)
- `VG-PY-002` - OS system call
- `VG-PY-003` - Unsafe YAML load
- `VG-PY-004` - Insecure pickle deserialization
- `VG-PY-005` - Flask debug mode enabled
- `VG-PY-006` - Disabled SSL verification

### Node.js
- `VG-NODE-001` - Child process exec
- `VG-NODE-002` - Spawn with shell
- `VG-NODE-003` - Unsafe HTML rendering (React)
- `VG-NODE-004` - Disabled TLS verification
- `VG-NODE-005` - TLS reject env bypass

### Docker
- `VG-DOCK-001` - Container running as root
- `VG-DOCK-002` - Docker socket exposed
- `VG-DOCK-003` - Privileged container

### Kubernetes
- `VG-K8S-001` - Cluster-admin role binding
- `VG-K8S-002` - Open ingress rules (0.0.0.0/0)
- `VG-K8S-003` - Missing runAsNonRoot

### Configuration
- `VG-CFG-001` - Service bound to 0.0.0.0
- `VG-CFG-002` - Public S3 bucket ACL

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

## License

MIT
