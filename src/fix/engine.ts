import { readFileSync } from 'fs';
import { join, isAbsolute } from 'path';
import type { Finding, DetectionRule } from '../rules/types.js';
import type { Fix, FixResult, FixOptions, ApplyResult } from './types.js';
import { getStrategy } from './strategies.js';
import { applyFixes, generateUnifiedDiff, dryRunFixes } from './patch.js';
import { allRules, ruleById } from '../rules/index.js';

/**
 * Get the rule for a finding
 */
function getRuleForFinding(finding: Finding): DetectionRule | undefined {
  return ruleById.get(finding.ruleId);
}

/**
 * Check if a finding is fixable
 */
export function isFixable(finding: Finding): boolean {
  const rule = getRuleForFinding(finding);
  return !!(rule?.fixable && rule?.fixStrategy);
}

/**
 * Get all fixable findings from a list
 */
export function getFixableFindings(findings: Finding[]): Finding[] {
  return findings.filter(isFixable);
}

/**
 * Generate a fix for a single finding
 */
export function generateFix(finding: Finding, basePath?: string): FixResult {
  const rule = getRuleForFinding(finding);

  if (!rule?.fixable || !rule?.fixStrategy) {
    return { success: false, fix: null, error: 'Rule is not fixable' };
  }

  const strategy = getStrategy(rule.fixStrategy);
  if (!strategy) {
    return { success: false, fix: null, error: `Unknown fix strategy: ${rule.fixStrategy}` };
  }

  // Resolve file path
  const filePath = resolveFilePath(finding.file, basePath);

  // Read file content
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (error) {
    return {
      success: false,
      fix: null,
      error: `Could not read file: ${filePath}`,
    };
  }

  // Check if strategy can fix this finding
  if (!strategy.canFix(finding, content)) {
    return { success: false, fix: null, error: 'Strategy cannot fix this specific case' };
  }

  // Generate the fix
  const result = strategy.generateFix(finding, content);

  // Update file path in fix to be absolute
  if (result.success && result.fix) {
    result.fix.file = filePath;
  }

  return result;
}

/**
 * Generate fixes for multiple findings
 */
export function generateFixes(
  findings: Finding[],
  basePath?: string
): { finding: Finding; result: FixResult }[] {
  const results: { finding: Finding; result: FixResult }[] = [];

  for (const finding of findings) {
    const result = generateFix(finding, basePath);
    results.push({ finding, result });
  }

  return results;
}

/**
 * Apply fixes to files
 * Groups fixes by file and applies them
 */
export function applyAllFixes(
  fixes: Fix[],
  options: FixOptions = {}
): ApplyResult[] {
  const results: ApplyResult[] = [];

  // Group fixes by file
  const byFile = new Map<string, Fix[]>();
  for (const fix of fixes) {
    const existing = byFile.get(fix.file) || [];
    existing.push(fix);
    byFile.set(fix.file, existing);
  }

  // Apply fixes to each file
  for (const [file, fileFixes] of byFile) {
    if (options.dryRun) {
      // Just report what would be done
      results.push({ file, fixes: fileFixes, applied: false });
    } else {
      const result = applyFixes(file, fileFixes);
      results.push(result);
    }
  }

  return results;
}

/**
 * Print diff for a fix
 */
export function printDiff(fix: Fix): string {
  return generateUnifiedDiff(fix);
}

/**
 * Get a summary of fixable rules
 */
export function getFixableRules(): DetectionRule[] {
  return allRules.filter(r => r.fixable && r.fixStrategy);
}

// Helper function
function resolveFilePath(file: string, basePath?: string): string {
  if (isAbsolute(file)) {
    return file;
  }
  return basePath ? join(basePath, file) : file;
}

// Re-exports
export { generateUnifiedDiff, previewFix, applyFixes, dryRunFixes } from './patch.js';
export { getStrategy, strategies } from './strategies.js';
export type { Fix, FixResult, FixOptions, ApplyResult, FixStrategy } from './types.js';
