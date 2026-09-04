import * as path from 'path';
import type { Language, DetectionRule } from '../rules/types.js';

const extensionMap: Record<string, Language[]> = {
  '.py': ['python'],
  '.js': ['node'],
  '.ts': ['node', 'typescript'],
  '.tsx': ['node', 'typescript'],
  '.jsx': ['node'],
  '.mjs': ['node'],
  '.cjs': ['node'],
  '.yaml': ['yaml', 'kubernetes'],
  '.yml': ['yaml', 'kubernetes'],
  '.json': ['json'],
};

export function detectLanguages(filePath: string): Language[] {
  const basename = path.basename(filePath).toLowerCase();

  if (basename === 'dockerfile' || basename.endsWith('.dockerfile')) {
    return ['docker'];
  }

  if (basename === 'docker-compose.yml' || basename === 'docker-compose.yaml') {
    return ['docker', 'yaml'];
  }

  if (
    basename.includes('k8s') ||
    basename.includes('kubernetes') ||
    basename.includes('deployment') ||
    basename.includes('service') ||
    basename.includes('ingress')
  ) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.yml' || ext === '.yaml') {
      return ['kubernetes', 'yaml'];
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  return extensionMap[ext] || [];
}

export function filterRulesForFile(
  filePath: string,
  allRules: DetectionRule[]
): DetectionRule[] {
  const basename = path.basename(filePath);
  const languages = detectLanguages(filePath);

  return allRules.filter((rule) => {
    const langMatch = rule.languages.some((lang) => languages.includes(lang));
    if (!langMatch) return false;

    const patternMatch = rule.filePatterns.some((pattern) => matchesPattern(basename, pattern));

    return patternMatch;
  });
}

function matchesPattern(basename: string, pattern: string): boolean {
  const normalizedBasename = basename.toLowerCase();

  // Strip globstar prefix: a leading "**" followed by "/" is equivalent to no prefix
  // when matching against a basename.
  let p = pattern.toLowerCase();
  if (p.startsWith('**' + '/')) p = p.slice(3);

  if (p === '*' || p === '**') return true;

  if (p.startsWith('*.') && p.indexOf('*', 2) === -1) {
    return normalizedBasename.endsWith(p.slice(1));
  }

  // Trailing wildcard, e.g. `*.env*`
  if (p.startsWith('*.') && p.endsWith('*')) {
    const stem = p.slice(1, -1); // ".env"
    return normalizedBasename.includes(stem);
  }

  return normalizedBasename === p;
}
