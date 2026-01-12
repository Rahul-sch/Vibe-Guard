import { diffLines, Change } from 'diff';
import chalk from 'chalk';
import type { Fix } from './types.js';

/**
 * Format a fix as a git-style diff with colored output
 * Red background for removed lines, green background for added lines
 */
export function formatGitStyleDiff(fix: Fix): string {
  const lines: string[] = [];

  // Header
  lines.push(chalk.bold(`--- ${fix.file}`));
  lines.push(chalk.bold(`+++ ${fix.file}`));
  lines.push('');

  // Generate diff
  const changes = diffLines(fix.original, fix.replacement);

  // Format each change
  for (const change of changes) {
    if (change.added) {
      // Added lines - green background
      const addedLines = change.value.split('\n').filter(l => l.length > 0);
      for (const line of addedLines) {
        lines.push(chalk.bgGreen.black(`+ ${line}`));
      }
    } else if (change.removed) {
      // Removed lines - red background
      const removedLines = change.value.split('\n').filter(l => l.length > 0);
      for (const line of removedLines) {
        lines.push(chalk.bgRed.white(`- ${line}`));
      }
    } else {
      // Unchanged context lines - gray
      const contextLines = change.value.split('\n').filter(l => l.length > 0);
      for (const line of contextLines) {
        lines.push(chalk.gray(`  ${line}`));
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Format multiple fixes as a unified diff view
 */
export function formatMultipleDiffs(fixes: Fix[]): string {
  const sections: string[] = [];

  sections.push(chalk.bold.cyan('═══ Proposed Changes ═══'));
  sections.push('');

  for (const fix of fixes) {
    sections.push(chalk.yellow(`File: ${fix.file}`));
    sections.push(chalk.cyan(`Rule: ${fix.ruleId} - ${fix.description || 'Security fix'}`));
    sections.push('');
    sections.push(formatGitStyleDiff(fix));
    sections.push(chalk.gray('─'.repeat(80)));
    sections.push('');
  }

  return sections.join('\n');
}
