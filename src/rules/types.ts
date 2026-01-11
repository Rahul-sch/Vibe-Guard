export type RuleSeverity = 'critical' | 'warning' | 'info';

export type RuleCategory =
  | 'secrets'
  | 'injection'
  | 'deserialization'
  | 'config'
  | 'crypto'
  | 'docker'
  | 'kubernetes'
  | 'dependency';

export type Language =
  | 'node'
  | 'typescript'
  | 'python'
  | 'docker'
  | 'kubernetes'
  | 'yaml'
  | 'json';

export interface DetectionRule {
  id: string;
  title: string;
  severity: RuleSeverity;
  category: RuleCategory;
  languages: Language[];
  filePatterns: string[];
  pattern: RegExp;
  allowPatterns?: RegExp[];
  pathExclude?: string[];
  message: string;
  remediation?: string;
  references?: string[];
  confidence: 'high' | 'medium' | 'low';
  cwe?: string;
  owasp?: string;
  aiVerification?: {
    enabled: boolean;
    promptTemplate?: string;
  };
}

export interface Finding {
  ruleId: string;
  title: string;
  severity: RuleSeverity;
  category: RuleCategory;
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  snippet: string;
  match: string;
  message: string;
  remediation?: string;
  cwe?: string;
  owasp?: string;
  aiVerdict?: {
    verdict: 'true_positive' | 'false_positive' | 'unsure';
    confidence: number;
    rationale: string;
  };
}

export interface ScanConfig {
  targetPath: string;
  ignorePatterns: string[];
  maxFileSize: number;
  includeSeverities: RuleSeverity[];
  includeCategories?: RuleCategory[];
  ruleIds?: string[];
  format: 'console' | 'json' | 'sarif';
  noColor: boolean;
  verbose: boolean;
  aiVerify: boolean;
  aiProvider?: string;
  aiApiKey?: string;
  aiModel?: string;
}

export interface ScanResult {
  scannedFiles: number;
  skippedFiles: number;
  totalFindings: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  findings: Finding[];
  duration: number;
  timestamp: string;
}
