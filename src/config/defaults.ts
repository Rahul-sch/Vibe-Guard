import type { RuleSeverity } from '../rules/types.js';
import type { ReporterType } from '../reporters/types.js';

export interface VibeGuardConfig {
  targetPath: string;
  ignorePatterns: string[];
  maxFileSize: number;
  includeSeverities: RuleSeverity[];
  ruleIds?: string[];
  format: ReporterType;
  noColor: boolean;
  verbose: boolean;
  aiVerify: boolean;
  aiProvider?: string;
  aiApiKey?: string;
}

export const DEFAULT_CONFIG: VibeGuardConfig = {
  targetPath: '.',
  ignorePatterns: [],
  maxFileSize: 1024 * 1024, // 1MB
  includeSeverities: ['critical', 'warning'],
  format: 'console',
  noColor: false,
  verbose: false,
  aiVerify: false,
};

export const DEFAULT_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/.next/**',
  '**/build/**',
  '**/coverage/**',
  '**/.venv/**',
  '**/__pycache__/**',
  '**/vendor/**',
];
