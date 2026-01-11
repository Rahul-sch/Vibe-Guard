import type { DetectionRule, Finding } from '../rules/types.js';
import {
  buildLineIndex,
  offsetToLineCol,
  extractSnippet,
} from '../utils/line-mapper.js';

export interface MatchResult {
  match: string;
  index: number;
  line: number;
  column: number;
  snippet: string;
}

export function matchRule(
  content: string,
  rule: DetectionRule
): MatchResult[] {
  const results: MatchResult[] = [];
  const lineStarts = buildLineIndex(content);

  const flags = rule.pattern.flags.includes('g')
    ? rule.pattern.flags
    : rule.pattern.flags + 'g';
  const regex = new RegExp(rule.pattern.source, flags);

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const matchText = match[0];

    if (rule.allowPatterns?.some((p) => p.test(matchText))) {
      continue;
    }

    const { line, column } = offsetToLineCol(match.index, lineStarts);
    const snippet = extractSnippet(content, line, lineStarts);

    results.push({
      match: matchText,
      index: match.index,
      line,
      column,
      snippet,
    });

    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  return results;
}

export function createFinding(
  rule: DetectionRule,
  matchResult: MatchResult,
  relativePath: string
): Finding {
  return {
    ruleId: rule.id,
    title: rule.title,
    severity: rule.severity,
    category: rule.category,
    file: relativePath,
    line: matchResult.line,
    column: matchResult.column,
    snippet: matchResult.snippet,
    match: matchResult.match,
    message: rule.message,
    remediation: rule.remediation,
    cwe: rule.cwe,
    owasp: rule.owasp,
  };
}
