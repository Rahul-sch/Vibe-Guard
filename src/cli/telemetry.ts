import Table from 'cli-table3';
import chalk from 'chalk';
import type { ScanResult } from '../rules/types.js';
import { ruleById } from '../rules/index.js';

/**
 * Generate a telemetry summary table for scan results
 * Shows categorized breakdown of findings
 */
export function generateTelemetrySummary(result: ScanResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold.cyan('═══ Telemetry Summary ═══'));
  lines.push('');

  // Scan stats table
  const scanTable = new Table({
    head: [chalk.bold('Metric'), chalk.bold('Value')],
    colWidths: [30, 20],
    style: {
      head: [],
      border: ['gray'],
    },
  });

  scanTable.push(
    ['Files Scanned', chalk.green(result.scannedFiles.toString())],
    ['Files Skipped', chalk.gray(result.skippedFiles.toString())],
    ['Scan Duration', chalk.cyan(`${(result.duration / 1000).toFixed(2)}s`)],
    ['Rules Evaluated', chalk.magenta(ruleById.size.toString())],
    ['Total Findings', result.findings.length > 0 ? chalk.yellow(result.findings.length.toString()) : chalk.green('0')]
  );

  lines.push(scanTable.toString());
  lines.push('');

  // Severity breakdown table
  if (result.findings.length > 0) {
    const severityTable = new Table({
      head: [chalk.bold('Severity'), chalk.bold('Count'), chalk.bold('Percentage')],
      colWidths: [20, 15, 15],
      style: {
        head: [],
        border: ['gray'],
      },
    });

    const total = result.findings.length;
    const criticalPct = ((result.criticalCount / total) * 100).toFixed(1);
    const warningPct = ((result.warningCount / total) * 100).toFixed(1);
    const infoPct = ((result.infoCount / total) * 100).toFixed(1);

    severityTable.push(
      [
        chalk.red.bold('🔴 Critical'),
        chalk.red(result.criticalCount.toString()),
        chalk.red(`${criticalPct}%`)
      ],
      [
        chalk.yellow.bold('🟡 Warning'),
        chalk.yellow(result.warningCount.toString()),
        chalk.yellow(`${warningPct}%`)
      ],
      [
        chalk.blue.bold('🔵 Info'),
        chalk.blue(result.infoCount.toString()),
        chalk.blue(`${infoPct}%`)
      ]
    );

    lines.push(severityTable.toString());
    lines.push('');

    // Category breakdown
    const categoryMap = new Map<string, number>();
    for (const finding of result.findings) {
      const rule = ruleById.get(finding.ruleId);
      if (rule) {
        categoryMap.set(rule.category, (categoryMap.get(rule.category) || 0) + 1);
      }
    }

    if (categoryMap.size > 0) {
      const categoryTable = new Table({
        head: [chalk.bold('Category'), chalk.bold('Issues'), chalk.bold('Risk Level')],
        colWidths: [20, 15, 20],
        style: {
          head: [],
          border: ['gray'],
        },
      });

      const sortedCategories = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1]);

      for (const [category, count] of sortedCategories) {
        const riskLevel = count >= 5 ? chalk.red('⚠️  High') :
                         count >= 3 ? chalk.yellow('⚠️  Medium') :
                         chalk.green('✓ Low');

        categoryTable.push([
          chalk.cyan(category.charAt(0).toUpperCase() + category.slice(1)),
          chalk.white(count.toString()),
          riskLevel
        ]);
      }

      lines.push(categoryTable.toString());
      lines.push('');
    }
  }

  // Security score
  const securityScore = calculateSecurityScore(result);
  const scoreColor = securityScore >= 80 ? chalk.green :
                     securityScore >= 60 ? chalk.yellow :
                     chalk.red;

  lines.push(chalk.bold('Security Score: ') + scoreColor.bold(`${securityScore}/100`));
  lines.push('');

  return lines.join('\n');
}

/**
 * Calculate a security score based on findings
 * 100 = perfect (no issues)
 * 0 = critical failures
 */
function calculateSecurityScore(result: ScanResult): number {
  if (result.findings.length === 0) {
    return 100;
  }

  // Penalty system
  const criticalPenalty = result.criticalCount * 20;
  const warningPenalty = result.warningCount * 5;
  const infoPenalty = result.infoCount * 1;

  const totalPenalty = criticalPenalty + warningPenalty + infoPenalty;
  const score = Math.max(0, 100 - totalPenalty);

  return Math.round(score);
}
