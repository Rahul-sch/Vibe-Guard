import { describe, expect, it } from 'vitest';
import { allRules, ruleById, rulesByLanguage } from '../../src/rules/index.js';

describe('rule catalog', () => {
  it('registers every rule exactly once with complete matcher metadata', () => {
    expect(allRules).toHaveLength(88);
    expect(new Set(allRules.map((rule) => rule.id)).size).toBe(allRules.length);
    for (const rule of allRules) {
      expect(ruleById.get(rule.id)).toBe(rule);
      expect(rule.pattern).toBeInstanceOf(RegExp);
      expect(rule.filePatterns.length).toBeGreaterThan(0);
      expect(rule.languages.length).toBeGreaterThan(0);
      expect(rule.message).not.toHaveLength(0);
    }
  });

  it('indexes each rule under every language it declares', () => {
    for (const rule of allRules) {
      for (const language of rule.languages) {
        expect(rulesByLanguage.get(language)).toContain(rule);
      }
    }
  });
});
