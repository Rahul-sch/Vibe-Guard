import { AuthenticationError } from './types.js';

export const GITHUB_DEVICE_CODE_URL = 'https://github.com/login/device/code';
export const GITHUB_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
export const GITHUB_USER_URL = 'https://api.github.com/user';
export const GITHUB_AUTH_SCOPE = 'read:user';

export function resolveGitHubClientId(
  environment: NodeJS.ProcessEnv = process.env
): string {
  const clientId = environment.VIBEGUARD_GITHUB_CLIENT_ID?.trim();

  if (!clientId) {
    throw new AuthenticationError(
      'GitHub sign-in is not configured. Set VIBEGUARD_GITHUB_CLIENT_ID to the client ID of your GitHub OAuth app.',
      'missing_client_id'
    );
  }

  return clientId;
}
