import type { Finding, DetectionRule } from '../rules/types.js';
import type { AIConfig, VerifyRequest, VerifyResponse } from './types.js';
import { createProvider } from './provider.js';
import { getCacheKey, getCached, setCache } from './cache.js';
import { basename } from 'node:path';

export interface AIVerifier {
  verify(finding: Finding, rule: DetectionRule): Promise<VerifyResponse>;
}

export function createAIVerifier(config: AIConfig): AIVerifier {
  const provider = createProvider(config);

  return {
    async verify(finding: Finding, rule: DetectionRule): Promise<VerifyResponse> {
      // Check cache first
      const cacheKey = getCacheKey(finding.ruleId, finding.snippet);
      const cached = getCached(cacheKey);
      if (cached) {
        return cached;
      }

      // Build request with minimal context
      const request: VerifyRequest = {
        snippet: truncate(finding.snippet, 500),
        ruleId: rule.id,
        ruleTitle: rule.title,
        ruleDescription: rule.message,
        fileContext: `File: ${basename(finding.file)}, Language: ${rule.languages[0] || 'unknown'}`,
      };

      const response = await provider.verify(request);

      // Cache the result
      setCache(cacheKey, response);

      return response;
    },
  };
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export async function verifyFindings(
  findings: Finding[],
  rules: Map<string, DetectionRule>,
  config: AIConfig,
  verbose = false
): Promise<Finding[]> {
  const verifier = createAIVerifier(config);
  const verified: Finding[] = [];

  for (const finding of findings) {
    const rule = rules.get(finding.ruleId);
    if (!rule) {
      verified.push(finding);
      continue;
    }

    // Only verify rules that have AI verification enabled
    if (!rule.aiVerification?.enabled) {
      verified.push(finding);
      continue;
    }

    if (verbose) {
      console.error(`AI verifying: ${finding.ruleId} at ${finding.file}:${finding.line}`);
    }

    try {
      const response = await verifier.verify(finding, rule);
      verified.push({
        ...finding,
        aiVerdict: response,
      });
    } catch {
      // On error, keep finding without AI verdict
      verified.push(finding);
    }
  }

  return verified;
}

export function detectProvider(apiKey: string): string {
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('gsk_')) return 'groq';
  return 'openai';
}

export { type AIConfig, type VerifyRequest, type VerifyResponse } from './types.js';
