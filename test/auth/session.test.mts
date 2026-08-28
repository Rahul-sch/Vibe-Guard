import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveCredentials } from '../../src/auth/credential-store.js';
import { fetchGitHubUser, getCurrentUser } from '../../src/auth/session.js';

describe('GitHub auth session', () => {
  const directories: string[] = [];

  afterEach(async () => {
    await Promise.all(directories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    ));
  });

  it('normalizes the authenticated GitHub profile', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      login: 'octocat', id: 1, name: 'The Octocat',
      avatar_url: 'https://example.com/avatar', html_url: 'https://github.com/octocat',
    }), { status: 200 }));

    await expect(fetchGitHubUser('token-1', fetchImpl)).resolves.toEqual({
      login: 'octocat', id: 1, name: 'The Octocat',
      avatarUrl: 'https://example.com/avatar', profileUrl: 'https://github.com/octocat',
    });
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer token-1');
  });

  it('returns null when no credentials are stored', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vibeguard-session-'));
    directories.push(directory);
    await expect(getCurrentUser({ VIBEGUARD_CONFIG_DIR: directory })).resolves.toBeNull();
  });

  it('rejects expired or revoked tokens', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vibeguard-session-'));
    directories.push(directory);
    const environment = { VIBEGUARD_CONFIG_DIR: directory };
    await saveCredentials({
      accessToken: 'expired', tokenType: 'bearer', scope: 'read:user', createdAt: 'now',
    }, environment);

    await expect(getCurrentUser(environment, async () => new Response(null, { status: 401 })))
      .rejects.toMatchObject({ code: 'invalid_token' });
  });
});
