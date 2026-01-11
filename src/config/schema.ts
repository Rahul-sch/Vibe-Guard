import type { RuleSeverity } from '../rules/types.js';
import type { ReporterType } from '../reporters/types.js';

export interface ConfigFileSchema {
  targetPath?: string;
  ignore?: string[];
  maxFileSize?: number;
  severity?: RuleSeverity | RuleSeverity[];
  rules?: string[];
  format?: ReporterType;
  noColor?: boolean;
  verbose?: boolean;
  ai?: boolean;
  aiProvider?: string;
  aiApiKey?: string;
}

export function validateSeverity(value: string): RuleSeverity {
  const valid: RuleSeverity[] = ['critical', 'warning', 'info'];
  if (!valid.includes(value as RuleSeverity)) {
    throw new Error(`Invalid severity: ${value}. Must be one of: ${valid.join(', ')}`);
  }
  return value as RuleSeverity;
}

export function validateFormat(value: string): ReporterType {
  const valid: ReporterType[] = ['console', 'json', 'sarif'];
  if (!valid.includes(value as ReporterType)) {
    throw new Error(`Invalid format: ${value}. Must be one of: ${valid.join(', ')}`);
  }
  return value as ReporterType;
}

export function validateMaxFileSize(value: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid max-file-size: ${value}. Must be a positive number.`);
  }
  return num;
}

// Severity hierarchy: critical > warning > info
const SEVERITY_LEVELS: Record<RuleSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

export function severitiesAtOrAbove(minSeverity: RuleSeverity): RuleSeverity[] {
  const minLevel = SEVERITY_LEVELS[minSeverity];
  return (['critical', 'warning', 'info'] as RuleSeverity[]).filter(
    (s) => SEVERITY_LEVELS[s] >= minLevel
  );
}

export function parseSeverities(input: string | string[]): RuleSeverity[] {
  // If single severity, treat as minimum (include this and above)
  if (typeof input === 'string') {
    return severitiesAtOrAbove(validateSeverity(input));
  }
  // If array, use exact list
  return input.map(validateSeverity);
}
