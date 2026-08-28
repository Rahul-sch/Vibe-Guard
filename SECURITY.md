# Security Policy

VibeGuard is a security scanner and handles source code, optional provider API keys, and optional GitHub credentials. Security reports are taken seriously.

## Supported versions

Security fixes are provided for the latest version published under `@rahul-sch/vibeguard`.

## Report a vulnerability

Please do not open a public issue for a suspected vulnerability.

Use [GitHub private vulnerability reporting](https://github.com/Rahul-sch/Vibe-Guard/security/advisories/new) and include:

- The affected version
- A clear description of the impact
- Reproduction steps or a minimal proof of concept
- Any suggested mitigation

Do not include real credentials, private source code, or data belonging to another person.

## Security model

- Scanning is local and does not require an account.
- AI verification is opt-in. When enabled, source snippets associated with findings may be sent to the selected AI provider.
- GitHub sign-in uses OAuth device authorization with the `read:user` scope. VibeGuard never collects GitHub passwords or embeds a client secret.
- GitHub credentials are stored outside scanned projects. Unix credential files use owner-only permissions.
- Scan targets have file-size limits, binary-file filtering, and path-boundary checks.
- Fixes should be previewed with `vibeguard fix . --dry-run` before being applied.

## Operational guidance

- Keep VibeGuard and Node.js updated.
- Store API keys in environment variables or CI secret stores, never repository configuration.
- Run the CLI with only the filesystem permissions it needs.
- Review findings and generated fixes before deployment.
- Use `vibeguard logout` on shared machines.

## Scope

Reports about vulnerabilities in VibeGuard itself are in scope. Vulnerabilities that VibeGuard does not currently detect are feature requests unless they demonstrate a bypass of a documented security guarantee.
