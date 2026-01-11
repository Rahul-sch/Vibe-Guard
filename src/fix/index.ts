// Fix Engine - Auto-fix security issues
export {
  isFixable,
  getFixableFindings,
  generateFix,
  generateFixes,
  applyAllFixes,
  printDiff,
  getFixableRules,
  generateUnifiedDiff,
  previewFix,
  applyFixes,
  dryRunFixes,
  getStrategy,
  strategies,
} from './engine.js';

export type {
  Fix,
  FixResult,
  FixOptions,
  ApplyResult,
  FixStrategy,
} from './types.js';
