import { expect } from 'vitest';
import { matchRule } from '../../src/engine/matcher.js';
import { ruleById } from '../../src/rules/index.js';

export function expectMatches(ruleId: string, source: string): void {
  const rule = ruleById.get(ruleId);
  expect(rule, `Missing rule ${ruleId}`).toBeDefined();
  expect(matchRule(source, rule!), `${ruleId} should match: ${source}`).not.toHaveLength(0);
}

export function expectNoMatch(ruleId: string, source: string): void {
  const rule = ruleById.get(ruleId);
  expect(rule, `Missing rule ${ruleId}`).toBeDefined();
  expect(matchRule(source, rule!), `${ruleId} should not match: ${source}`).toHaveLength(0);
}
