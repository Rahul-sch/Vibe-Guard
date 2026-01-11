import type { ScanResult, Finding } from '../rules/types.js';
import { isFixable } from '../fix/index.js';

export function formatPRComment(result: ScanResult): string {
  const critical = result.findings.filter(f => f.severity === 'critical');
  const warning = result.findings.filter(f => f.severity === 'warning');
  const fixable = result.findings.filter(f => isFixable(f));

  const sections: string[] = [];

  // Header
  sections.push('## 🛡️ VibeGuard Security Scan\n');

  // Summary table
  sections.push('| Severity | Count |');
  sections.push('|----------|-------|');
  sections.push(`| 🔴 Critical | ${critical.length} |`);
  sections.push(`| 🟡 Warning | ${warning.length} |`);
  sections.push('');

  // Auto-fixable callout
  if (fixable.length > 0) {
    sections.push(`### ✅ Auto-fixable: ${fixable.length} issues`);
    sections.push('Comment `/vibeguard fix` to apply fixes.\n');
  }

  // Critical issues (expanded)
  if (critical.length > 0) {
    sections.push('### 🔴 Critical Issues\n');
    critical.forEach(f => {
      sections.push(`- **${f.ruleId}** \`${f.file}:${f.line}\``);
      sections.push(`  ${f.message}`);
      if (isFixable(f)) {
        sections.push(`  ✅ *Auto-fixable*`);
      }
      sections.push('');
    });
  }

  // Warning issues (collapsed)
  if (warning.length > 0) {
    sections.push('<details>');
    sections.push('<summary>🟡 View warnings</summary>\n');
    warning.forEach(f => {
      sections.push(`- **${f.ruleId}** \`${f.file}:${f.line}\` - ${f.message}`);
    });
    sections.push('\n</details>\n');
  }

  // Footer
  sections.push('---');
  sections.push('<sub>Powered by [VibeGuard](https://github.com/vibeguard/vibeguard)</sub>');

  return sections.join('\n');
}

export function formatInlineComment(finding: Finding): string {
  const lines: string[] = [];

  lines.push(`🔴 **${finding.ruleId}**: ${finding.message}\n`);

  if (finding.snippet) {
    lines.push('```');
    lines.push(finding.snippet);
    lines.push('```\n');
  }

  if (finding.remediation) {
    lines.push(`**Fix:** ${finding.remediation}\n`);
  }

  if (finding.cwe) {
    const cweNum = finding.cwe.replace('CWE-', '');
    lines.push(`[${finding.cwe}](https://cwe.mitre.org/data/definitions/${cweNum}.html)`);
  }

  if (isFixable(finding)) {
    lines.push('\n✅ *This issue can be auto-fixed. Comment `/vibeguard fix` to apply.*');
  }

  return lines.join('\n');
}
