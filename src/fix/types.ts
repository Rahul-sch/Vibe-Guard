import type { Finding } from '../rules/types.js';

/**
 * Represents a single fix to apply to a file
 */
export interface Fix {
  file: string;
  start: number;  // Character offset
  end: number;    // Character offset
  original: string;
  replacement: string;
  ruleId: string;
  description: string;
}

/**
 * Result of attempting to generate a fix
 */
export interface FixResult {
  success: boolean;
  fix: Fix | null;
  error?: string;
}

/**
 * A fix strategy transforms a finding into a fix
 */
export interface FixStrategy {
  name: string;
  canFix(finding: Finding, content: string): boolean;
  generateFix(finding: Finding, content: string): FixResult;
}

/**
 * Options for the fix command
 */
export interface FixOptions {
  dryRun?: boolean;
  yes?: boolean;
  git?: boolean;
  basePath?: string;
  verbose?: boolean;
}

/**
 * Result of applying fixes to a file
 */
export interface ApplyResult {
  file: string;
  fixes: Fix[];
  applied: boolean;
  error?: string;
}
