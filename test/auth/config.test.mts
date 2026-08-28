import { describe, expect, it } from 'vitest';
import { resolveGitHubClientId } from '../../src/auth/config.js';

describe('GitHub auth configuration', () => {
  it('reads and trims the OAuth client ID', () => {
    expect(resolveGitHubClientId({ VIBEGUARD_GITHUB_CLIENT_ID: ' client-123 ' }))
      .toBe('client-123');
  });

  it('rejects missing configuration', () => {
    expect(() => resolveGitHubClientId({})).toThrow('GitHub sign-in is not configured');
  });
});
