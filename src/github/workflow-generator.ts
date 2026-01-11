import type { InstallOptions } from './types.js';

export function generateWorkflowYAML(options: InstallOptions): string {
  const autoFixJob = options.autoFix ? `
  auto-fix:
    if: |
      github.event_name == 'issue_comment' &&
      github.event.issue.pull_request &&
      contains(github.event.comment.body, '👍')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: refs/pull/\${{ github.event.issue.number }}/head
          token: \${{ secrets.GITHUB_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install VibeGuard
        run: npm install -g vibeguard

      - name: Apply fixes
        run: vibeguard fix --yes

      - name: Commit fixes
        run: |
          git config user.name "VibeGuard Bot"
          git config user.email "bot@vibeguard.dev"
          git add -A
          git commit -m "fix(security): apply VibeGuard auto-fixes" || echo "No changes"
          git push` : '';

  const aiVerifyFlag = options.aiVerify ? ' --ai' : '';

  return `name: VibeGuard Security Scan

on:
  pull_request:
    types: [opened, synchronize, reopened]${options.autoFix ? `
  issue_comment:
    types: [created]` : ''}

permissions:
  contents: ${options.autoFix ? 'write' : 'read'}
  pull-requests: write
  issues: write

jobs:
  scan:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.head.ref }}

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install VibeGuard
        run: npm install -g vibeguard

      - name: Scan for security issues
        id: scan
        run: |
          vibeguard scan --json${aiVerifyFlag} --severity ${options.severityThreshold} > scan-results.json || true
          echo "findings=\$(jq -r '.findings | length' scan-results.json)" >> $GITHUB_OUTPUT

      - name: Post PR comment
        if: steps.scan.outputs.findings != '0'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('scan-results.json'));

            const critical = results.findings.filter(f => f.severity === 'critical').length;
            const warning = results.findings.filter(f => f.severity === 'warning').length;
            const fixable = results.findings.filter(f => f.fixable).length;

            const body = \`## 🛡️ VibeGuard Security Scan

| Severity | Count |
|----------|-------|
| 🔴 Critical | \${critical} |
| 🟡 Warning | \${warning} |

\${fixable > 0 ? \`### ✅ Auto-fixable: \${fixable} issues

React with 👍 to this comment to automatically apply fixes.
\` : ''}
<details>
<summary>View all findings</summary>

\${results.findings.map(f => \`- **\${f.ruleId}** \\\`\${f.file}:\${f.line}\\\` - \${f.message}\`).join('\\n')}

</details>

---
<sub>Powered by [VibeGuard](https://github.com/vibeguard/vibeguard)</sub>\`;

            await github.rest.issues.createComment({
              ...context.repo,
              issue_number: context.issue.number,
              body
            });
${autoFixJob}
`;
}
