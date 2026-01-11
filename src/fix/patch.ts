import { readFileSync, writeFileSync } from 'fs';
import type { Fix, ApplyResult } from './types.js';

/**
 * Generate a unified diff string for a fix
 */
export function generateUnifiedDiff(fix: Fix, content?: string): string {
  const original = fix.original;
  const replacement = fix.replacement;

  // Simple unified diff format
  const lines: string[] = [];
  lines.push(`--- a/${fix.file}`);
  lines.push(`+++ b/${fix.file}`);
  lines.push(`@@ -1,1 +1,1 @@`);

  // Show original lines with -
  for (const line of original.split('\n')) {
    lines.push(`-${line}`);
  }

  // Show replacement lines with +
  for (const line of replacement.split('\n')) {
    lines.push(`+${line}`);
  }

  return lines.join('\n');
}

/**
 * Preview a fix showing before/after
 */
export function previewFix(fix: Fix): string {
  const lines: string[] = [];
  lines.push(`File: ${fix.file}`);
  lines.push(`Rule: ${fix.ruleId}`);
  lines.push(`Description: ${fix.description}`);
  lines.push('');
  lines.push('Before:');
  lines.push(`  ${fix.original}`);
  lines.push('');
  lines.push('After:');
  lines.push(`  ${fix.replacement}`);
  return lines.join('\n');
}

/**
 * Apply a single fix to file content
 * Returns the modified content
 */
export function applyFixToContent(content: string, fix: Fix): string {
  // Verify the original text is at the expected position
  const actualText = content.slice(fix.start, fix.end);
  if (actualText !== fix.original) {
    throw new Error(
      `Content mismatch at offset ${fix.start}. ` +
      `Expected "${fix.original}" but found "${actualText}"`
    );
  }

  // Apply the fix
  return content.slice(0, fix.start) + fix.replacement + content.slice(fix.end);
}

/**
 * Apply multiple fixes to a file
 * Fixes must be sorted by start offset (descending) to avoid offset corruption
 */
export function applyFixes(filePath: string, fixes: Fix[]): ApplyResult {
  if (fixes.length === 0) {
    return { file: filePath, fixes: [], applied: false };
  }

  try {
    let content = readFileSync(filePath, 'utf-8');

    // Sort fixes by start offset descending (apply from end to beginning)
    const sortedFixes = [...fixes].sort((a, b) => b.start - a.start);

    // Apply each fix
    for (const fix of sortedFixes) {
      content = applyFixToContent(content, fix);
    }

    // Write the modified content
    writeFileSync(filePath, content);

    return { file: filePath, fixes, applied: true };
  } catch (error) {
    return {
      file: filePath,
      fixes,
      applied: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply fixes in dry-run mode (returns what would be changed)
 */
export function dryRunFixes(filePath: string, fixes: Fix[], content: string): string {
  // Sort fixes by start offset descending
  const sortedFixes = [...fixes].sort((a, b) => b.start - a.start);

  // Apply each fix to get the final content
  let modifiedContent = content;
  for (const fix of sortedFixes) {
    modifiedContent = applyFixToContent(modifiedContent, fix);
  }

  return modifiedContent;
}
