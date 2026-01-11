import chalk from 'chalk';
import type { ScanResult, Finding } from '../rules/types.js';
import type { Reporter } from './types.js';

export class ConsoleReporter implements Reporter {
  private noColor: boolean;

  constructor(noColor = false) {
    this.noColor = noColor;
  }

  report(result: ScanResult): string {
    const lines: string[] = [];

    lines.push('');
    lines.push(this.style('  VibeGuard v1.0.0', 'bold'));
    lines.push('');
    lines.push(`  Scanning complete`);
    lines.push(`  Files: ${result.scannedFiles} scanned, ${result.skippedFiles} skipped`);
    lines.push('');

    if (result.findings.length === 0) {
      lines.push(this.style('  ✓ No issues found', 'green'));
    } else {
      const sorted = [...result.findings].sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      for (const finding of sorted) {
        lines.push(this.formatFinding(finding));
        lines.push('');
      }
    }

    lines.push('  ' + '─'.repeat(40));
    lines.push(
      `  Summary: ${this.style(String(result.criticalCount) + ' critical', 'red')}, ` +
        `${this.style(String(result.warningCount) + ' warnings', 'yellow')}, ` +
        `${result.infoCount} info`
    );
    lines.push(`  Duration: ${(result.duration / 1000).toFixed(1)}s`);
    lines.push('');

    return lines.join('\n');
  }

  private formatFinding(finding: Finding): string {
    const lines: string[] = [];

    const severityLabel = finding.severity.toUpperCase();
    const severityStyled =
      finding.severity === 'critical'
        ? this.style(severityLabel, 'redBold')
        : finding.severity === 'warning'
          ? this.style(severityLabel, 'yellow')
          : this.style(severityLabel, 'blue');

    lines.push(`  ${severityStyled}  ${this.style(finding.file + ':' + finding.line + ':' + finding.column, 'cyan')}`);
    lines.push(`  ${this.style(finding.ruleId, 'dim')}  ${finding.title}`);
    lines.push(`  → ${finding.snippet}`);

    if (finding.remediation) {
      lines.push(`  ${this.style('Remediation:', 'dim')} ${finding.remediation}`);
    }

    return lines.join('\n');
  }

  private style(
    text: string,
    style: 'bold' | 'red' | 'redBold' | 'yellow' | 'blue' | 'cyan' | 'dim' | 'green'
  ): string {
    if (this.noColor) return text;

    switch (style) {
      case 'bold':
        return chalk.bold(text);
      case 'red':
        return chalk.red(text);
      case 'redBold':
        return chalk.red.bold(text);
      case 'yellow':
        return chalk.yellow(text);
      case 'blue':
        return chalk.blue(text);
      case 'cyan':
        return chalk.cyan(text);
      case 'dim':
        return chalk.dim(text);
      case 'green':
        return chalk.green(text);
      default:
        return text;
    }
  }
}
