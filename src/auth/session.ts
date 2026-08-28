import { GITHUB_USER_URL } from './config.js';
import { loadCredentials } from './credential-store.js';
import type { AuthFetch } from './device-flow.js';
import type { GitHubUser } from './types.js';
import { AuthenticationError } from './types.js';

interface GitHubUserPayload {
  login?: string;
  id?: number;
  name?: string | null;
  avatar_url?: string;
  html_url?: string;
}

export async function fetchGitHubUser(
  accessToken: string,
  fetchImpl: AuthFetch = fetch
): Promise<GitHubUser> {
  const response = await fetchImpl(GITHUB_USER_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'VibeGuard-CLI',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (response.status === 401) {
    throw new AuthenticationError(
      'Your GitHub session is no longer valid. Run `vibeguard login` again.',
      'invalid_token'
    );
  }
  if (!response.ok) {
    throw new AuthenticationError(
      `GitHub user lookup failed with status ${response.status}.`,
      'github_http_error'
    );
  }

  const payload = await response.json() as GitHubUserPayload;
  if (!payload.login || typeof payload.id !== 'number') {
    throw new AuthenticationError(
      'GitHub returned an invalid user profile.',
      'invalid_user_response'
    );
  }

  return {
    login: payload.login,
    id: payload.id,
    name: payload.name ?? null,
    avatarUrl: payload.avatar_url || '',
    profileUrl: payload.html_url || `https://github.com/${payload.login}`,
  };
}

export async function getCurrentUser(
  environment: NodeJS.ProcessEnv = process.env,
  fetchImpl: AuthFetch = fetch
): Promise<GitHubUser | null> {
  const credentials = await loadCredentials(environment);
  if (!credentials) return null;
  return fetchGitHubUser(credentials.accessToken, fetchImpl);
}
