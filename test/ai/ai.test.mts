import { describe, it, expect } from 'vitest';
import { buildVerificationPrompt, parseVerificationResponse } from '../../src/ai/prompts.js';
import { getCacheKey, getCached, setCache, clearCache } from '../../src/ai/cache.js';
import { detectProvider } from '../../src/ai/index.js';
import type { VerifyRequest, VerifyResponse } from '../../src/ai/types.js';

describe('prompts', () => {
  const mockRequest: VerifyRequest = {
    snippet: 'eval(userInput)',
    ruleId: 'VG-SEC-001',
    ruleTitle: 'Dynamic Code Execution',
    ruleDescription: 'eval() is dangerous',
    fileContext: 'File: test.js, Language: node',
  };

  it('builds verification prompt with all fields', () => {
    const prompt = buildVerificationPrompt(mockRequest);

    expect(prompt).toContain('VG-SEC-001');
    expect(prompt).toContain('Dynamic Code Execution');
    expect(prompt).toContain('eval(userInput)');
    expect(prompt).toContain('test.js');
    expect(prompt).toContain('true_positive');
    expect(prompt).toContain('false_positive');
  });

  it('parses valid JSON response', () => {
    const response = `{
      "verdict": "true_positive",
      "confidence": 0.95,
      "rationale": "This is definitely dangerous"
    }`;

    const parsed = parseVerificationResponse(response);

    expect(parsed.verdict).toBe('true_positive');
    expect(parsed.confidence).toBe(0.95);
    expect(parsed.rationale).toBe('This is definitely dangerous');
  });

  it('parses JSON embedded in text', () => {
    const response = `Here is my analysis:
    {"verdict": "false_positive", "confidence": 0.8, "rationale": "Safe usage"}
    Hope this helps!`;

    const parsed = parseVerificationResponse(response);

    expect(parsed.verdict).toBe('false_positive');
    expect(parsed.confidence).toBe(0.8);
  });

  it('handles invalid verdict gracefully', () => {
    const response = '{"verdict": "maybe", "confidence": 0.5, "rationale": "test"}';
    const parsed = parseVerificationResponse(response);

    expect(parsed.verdict).toBe('unsure');
  });

  it('handles invalid confidence gracefully', () => {
    const response = '{"verdict": "true_positive", "confidence": "high", "rationale": "test"}';
    const parsed = parseVerificationResponse(response);

    expect(parsed.confidence).toBe(0.5);
  });

  it('handles malformed JSON gracefully', () => {
    const response = 'This is not JSON at all';
    const parsed = parseVerificationResponse(response);

    expect(parsed.verdict).toBe('unsure');
    expect(parsed.confidence).toBe(0.5);
    expect(parsed.rationale).toContain('Failed to parse');
  });
});

describe('cache', () => {
  beforeEach(() => {
    clearCache();
  });

  it('generates consistent cache keys', () => {
    const key1 = getCacheKey('VG-SEC-001', 'eval(x)');
    const key2 = getCacheKey('VG-SEC-001', 'eval(x)');
    const key3 = getCacheKey('VG-SEC-002', 'eval(x)');

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('stores and retrieves cached responses', () => {
    const key = getCacheKey('VG-SEC-001', 'test');
    const response: VerifyResponse = {
      verdict: 'true_positive',
      confidence: 0.9,
      rationale: 'Test rationale',
    };

    expect(getCached(key)).toBeUndefined();

    setCache(key, response);

    expect(getCached(key)).toEqual(response);
  });

  it('clears cache', () => {
    const key = getCacheKey('VG-SEC-001', 'test');
    setCache(key, { verdict: 'unsure', confidence: 0.5, rationale: 'test' });

    clearCache();

    expect(getCached(key)).toBeUndefined();
  });
});

describe('detectProvider', () => {
  it('detects Anthropic from API key', () => {
    expect(detectProvider('sk-ant-api03-xxxxx')).toBe('anthropic');
  });

  it('detects Groq from API key', () => {
    expect(detectProvider('gsk_xxxxx')).toBe('groq');
  });

  it('defaults to OpenAI for other keys', () => {
    expect(detectProvider('sk-xxxxx')).toBe('openai');
    expect(detectProvider('random-key')).toBe('openai');
  });
});
