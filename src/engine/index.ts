import type { Finding, ScanResult, RuleSeverity } from '../rules/types.js';
import { allRules } from '../rules/index.js';
import { walkFiles, readFileContent } from './file-walker.js';
import { filterRulesForFile } from './filter.js';
import { matchRule, createFinding } from './matcher.js';

export interface ScanOptions {
  targetPath: string;
  ignorePatterns?: string[];
  maxFileSize?: number;
  includeSeverities?: RuleSeverity[];
  ruleIds?: string[];
}

const DEFAULT_MAX_FILE_SIZE = 1024 * 1024; // 1MB

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const startTime = Date.now();

  const {
    targetPath,
    ignorePatterns = [],
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    includeSeverities = ['critical', 'warning'],
    ruleIds,
  } = options;

  let rulesToRun = allRules;
  if (ruleIds && ruleIds.length > 0) {
    rulesToRun = allRules.filter((r) => ruleIds.includes(r.id));
  }
  if (includeSeverities.length > 0) {
    rulesToRun = rulesToRun.filter((r) => includeSeverities.includes(r.severity));
  }

  const files = await walkFiles({
    targetPath,
    ignorePatterns,
    maxFileSize,
  });

  const findings: Finding[] = [];
  let scannedFiles = 0;
  let skippedFiles = 0;

  for (const file of files) {
    const content = await readFileContent(file.path, maxFileSize);

    if (content === null) {
      skippedFiles++;
      continue;
    }

    scannedFiles++;

    const applicableRules = filterRulesForFile(file.relativePath, rulesToRun);

    for (const rule of applicableRules) {
      const matches = matchRule(content, rule);

      for (const match of matches) {
        findings.push(createFinding(rule, match, file.relativePath));
      }
    }
  }

  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;
  const infoCount = findings.filter((f) => f.severity === 'info').length;

  return {
    scannedFiles,
    skippedFiles,
    totalFindings: findings.length,
    criticalCount,
    warningCount,
    infoCount,
    findings,
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

export { allRules } from '../rules/index.js';
