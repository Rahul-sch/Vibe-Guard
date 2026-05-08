import type { ScanResult, Finding } from '../rules/types.js';
import chalk from 'chalk';

/**
 * Table reporter for terminal output
 * Clean, formatted table display with colors
 */

interface TableRow {
  severity: string;
  rule: string;
  file: string;
  line: string;
  message: string;
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return chalk.red('🔴 CRITICAL');
    case 'warning':
      return chalk.yellow('🟡 WARNING ');
    case 'info':
      return chalk.blue('🔵 INFO    ');
    default:
      return severity;
  }
}

function formatTableRow(finding: Finding): TableRow {
  return {
    severity: severityColor(finding.severity),
    rule: chalk.cyan(finding.ruleId),
    file: chalk.white(truncate(finding.file, 40)),
    line: chalk.gray(`L${finding.line}`),
    message: truncate(finding.message, 60),
  };
}

function drawLine(widths: number[]): string {
  return '┼' + widths.map(w => '─'.repeat(w + 2)).join('┼') + '┼';
}

function drawTopLine(widths: number[]): string {
  return '┌' + widths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
}

function drawBottomLine(widths: number[]): string {
  return '└' + widths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';
}

function pad(str: string, width: number): string {
  // Remove ANSI codes for length calculation
  // eslint-disable-next-line no-control-regex
  const cleanStr = str.replace(/\u001b\[[0-9;]*m/g, '');
  const padding = ' '.repeat(Math.max(0, width - cleanStr.length));
  return str + padding;
}

export function tableReporter(result: ScanResult): string {
  const lines: string[] = [];

  if (result.findings.length === 0) {
    lines.push(chalk.green('✓ No security issues found!'));
    return lines.join('\n');
  }

  // Header
  lines.push('');
  lines.push(chalk.bold('🛡️  VibeGuard Security Scan Results'));
  lines.push('');

  // Summary stats
  const critical = result.findings.filter(f => f.severity === 'critical').length;
  const warning = result.findings.filter(f => f.severity === 'warning').length;
  const info = result.findings.filter(f => f.severity === 'info').length;

  lines.push(chalk.red(`🔴 Critical: ${critical}`) + '  ' +
             chalk.yellow(`🟡 Warning: ${warning}`) + '  ' +
             chalk.blue(`🔵 Info: ${info}`));
  lines.push('');

  // Table headers
  const headers = {
    severity: 'SEVERITY',
    rule: 'RULE',
    file: 'FILE',
    line: 'LINE',
    message: 'MESSAGE',
  };

  // Calculate column widths (strip ANSI for accurate width)
  const widths = {
    severity: 14, // Fixed for colored severity
    rule: 15,
    file: 42,
    line: 6,
    message: 62,
  };

  // Top border
  lines.push(drawTopLine([widths.severity, widths.rule, widths.file, widths.line, widths.message]));

  // Header row
  lines.push(
    '│ ' +
    pad(chalk.bold(headers.severity), widths.severity) + ' │ ' +
    pad(chalk.bold(headers.rule), widths.rule) + ' │ ' +
    pad(chalk.bold(headers.file), widths.file) + ' │ ' +
    pad(chalk.bold(headers.line), widths.line) + ' │ ' +
    pad(chalk.bold(headers.message), widths.message) + ' │'
  );

  // Separator
  lines.push(drawLine([widths.severity, widths.rule, widths.file, widths.line, widths.message]));

  // Data rows
  for (const finding of result.findings) {
    const row = formatTableRow(finding);
    lines.push(
      '│ ' +
      pad(row.severity, widths.severity) + ' │ ' +
      pad(row.rule, widths.rule) + ' │ ' +
      pad(row.file, widths.file) + ' │ ' +
      pad(row.line, widths.line) + ' │ ' +
      pad(row.message, widths.message) + ' │'
    );
  }

  // Bottom border
  lines.push(drawBottomLine([widths.severity, widths.rule, widths.file, widths.line, widths.message]));

  lines.push('');
  lines.push(chalk.gray(`Total: ${result.findings.length} issues found`));

  return lines.join('\n');
}
