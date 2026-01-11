import type { DetectionRule } from './types.js';
import { secretsRules } from './secrets.js';
import { pythonRules } from './python.js';
import { nodeRules } from './node.js';
import { dockerRules } from './docker.js';
import { kubernetesRules } from './kubernetes.js';
import { configRules } from './config.js';
import { dependencyRules } from './dependencies.js';

export const allRules: DetectionRule[] = [
  ...secretsRules,
  ...pythonRules,
  ...nodeRules,
  ...dockerRules,
  ...kubernetesRules,
  ...configRules,
  ...dependencyRules,
];

export const ruleById = new Map<string, DetectionRule>(
  allRules.map((r) => [r.id, r])
);

export const rulesByLanguage = new Map<string, DetectionRule[]>();
for (const rule of allRules) {
  for (const lang of rule.languages) {
    const existing = rulesByLanguage.get(lang) || [];
    existing.push(rule);
    rulesByLanguage.set(lang, existing);
  }
}

export { type DetectionRule, type Finding, type ScanConfig, type ScanResult } from './types.js';
