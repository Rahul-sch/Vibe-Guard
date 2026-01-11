import { LRUCache } from 'lru-cache';
import { createHash } from 'node:crypto';
import type { VerifyResponse } from './types.js';

const cache = new LRUCache<string, VerifyResponse>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24h TTL
});

export function getCacheKey(ruleId: string, snippet: string): string {
  return createHash('sha256')
    .update(ruleId + snippet)
    .digest('hex');
}

export function getCached(key: string): VerifyResponse | undefined {
  return cache.get(key);
}

export function setCache(key: string, response: VerifyResponse): void {
  cache.set(key, response);
}

export function clearCache(): void {
  cache.clear();
}
