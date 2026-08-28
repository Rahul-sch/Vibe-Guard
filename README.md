# VibeGuard

[![CI](https://github.com/Rahul-sch/Vibe-Guard/actions/workflows/ci.yml/badge.svg)](https://github.com/Rahul-sch/Vibe-Guard/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@rahul-sch/vibeguard)](https://www.npmjs.com/package/@rahul-sch/vibeguard)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

VibeGuard is a fast, regex-first security scanner for AI-generated code. It catches common secrets, injection flaws, unsafe configuration, weak cryptography, and cloud or container mistakes before they ship.

## Install

VibeGuard requires Node.js 18 or newer.

```bash
npm install --global @rahul-sch/vibeguard
```

## Quick start

```bash
# Scan the current directory
vibeguard scan .

# Scan a source directory and show only critical findings
vibeguard scan ./src --severity critical

# Produce machine-readable output
vibeguard scan . --json
vibeguard scan . --sarif > results.sarif

# Preview safe automatic fixes
vibeguard fix . --dry-run
```

Exit codes are CI-friendly: `0` means clean, `1` means warnings were found, and `2` means at least one critical issue was found.

## What it checks

VibeGuard includes 68 rules across 11 categories:

- Hardcoded credentials and provider tokens
- SQL, command, HTML, path-traversal, and SSRF injection
- Unsafe deserialization and cryptography
- Node.js and Python security mistakes
- Docker and Kubernetes misconfiguration
- Cloud, dependency, CORS, cookie, and security-header issues

Run `vibeguard --why` to list every rule or `vibeguard --why VG-SEC-002` to explain one rule.

VibeGuard is intentionally deterministic and lightweight. Regex scanning is useful for fast feedback, but it does not replace code review, dependency monitoring, or a full static-analysis platform.

## Common commands

| Command | Purpose |
| --- | --- |
| `vibeguard scan [path]` | Scan a directory |
| `vibeguard fix [path] --dry-run` | Preview available fixes |
| `vibeguard fix [path] --yes` | Apply available fixes |
| `vibeguard --why [rule-id]` | Explain detection rules |
| `vibeguard github install [path]` | Add the GitHub Actions workflow |
| `vibeguard login` | Sign in with GitHub |
| `vibeguard whoami` | Show the signed-in GitHub user |
| `vibeguard logout` | Remove the local GitHub session |

Use `vibeguard --help` or `vibeguard <command> --help` for all options.

## Configuration

Add `vibeguard.config.json` at the project root:

```json
{
  "severity": "warning",
  "ignore": ["**/test/**", "**/fixtures/**"],
  "format": "console"
}
```

Command-line options override the configuration file. Common options include:

- `--severity critical|warning|info`
- `--format console|json|sarif`
- `--ignore <glob>`
- `--max-file-size <bytes>`
- `--no-color`
- `--verbose`

## GitHub Actions

Generate a workflow in the current repository:

```bash
vibeguard github install .
git add .github/workflows/vibeguard.yml
git commit -m "ci: add VibeGuard security scan"
```

The generated workflow scans pull requests and can publish SARIF results to GitHub code scanning.

## Optional GitHub sign-in

Sign-in is optional; local scanning and fixing work without an account. To enable it, create a GitHub OAuth app, enable **Device Flow**, and expose its public client ID:

```bash
export VIBEGUARD_GITHUB_CLIENT_ID=your_oauth_client_id
vibeguard login
vibeguard whoami
```

The CLI requests only `read:user`. It never asks for a password or embeds an OAuth client secret. On Unix, credentials are stored outside the project with owner-only permissions. Use `vibeguard logout` to remove the local credential.

## Optional AI verification

AI verification is disabled by default and uses your own provider key:

```bash
export VIBEGUARD_AI_KEY=your_api_key
vibeguard scan . --ai --ai-provider openai
```

Supported providers are OpenAI, Anthropic, and Groq. Source snippets associated with findings may be sent to the selected provider when this feature is enabled.

## Development

```bash
git clone https://github.com/Rahul-sch/Vibe-Guard.git
cd Vibe-Guard
npm ci
npm test
npm run build
npm run lint
```

## Security

Please report vulnerabilities privately using the instructions in [SECURITY.md](SECURITY.md). Do not include secrets or exploit details in a public issue.

## License

[MIT](LICENSE)
