import {
  GITHUB_ACCESS_TOKEN_URL,
  GITHUB_AUTH_SCOPE,
  GITHUB_DEVICE_CODE_URL,
} from './config.js';
import type { AuthCredentials, DeviceCodeResponse } from './types.js';
import { AuthenticationError } from './types.js';

export type AuthFetch = (url: string, init: RequestInit) => Promise<Response>;
export type AuthSleep = (milliseconds: number) => Promise<void>;

interface DeviceCodePayload {
  device_code?: string;
  user_code?: string;
  verification_uri?: string;
  expires_in?: number;
  interval?: number;
  error?: string;
  error_description?: string;
}

interface AccessTokenPayload {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

const defaultSleep: AuthSleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function postForm<T>(
  url: string,
  values: Record<string, string>,
  fetchImpl: AuthFetch
): Promise<T> {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'VibeGuard-CLI',
    },
    body: new URLSearchParams(values).toString(),
  });

  if (!response.ok) {
    throw new AuthenticationError(
      `GitHub authentication request failed with status ${response.status}.`,
      'github_http_error'
    );
  }

  return response.json() as Promise<T>;
}

export async function requestDeviceCode(
  clientId: string,
  fetchImpl: AuthFetch = fetch
): Promise<DeviceCodeResponse> {
  const payload = await postForm<DeviceCodePayload>(
    GITHUB_DEVICE_CODE_URL,
    { client_id: clientId, scope: GITHUB_AUTH_SCOPE },
    fetchImpl
  );

  if (
    payload.error ||
    !payload.device_code ||
    !payload.user_code ||
    !payload.verification_uri ||
    !payload.expires_in
  ) {
    throw new AuthenticationError(
      payload.error_description || 'GitHub returned an invalid device authorization response.',
      payload.error || 'invalid_device_response'
    );
  }

  return {
    deviceCode: payload.device_code,
    userCode: payload.user_code,
    verificationUri: payload.verification_uri,
    expiresIn: payload.expires_in,
    interval: payload.interval || 5,
  };
}

export async function pollForAccessToken(
  clientId: string,
  device: DeviceCodeResponse,
  options: { fetchImpl?: AuthFetch; sleep?: AuthSleep; now?: () => number } = {}
): Promise<AuthCredentials> {
  const fetchImpl = options.fetchImpl || fetch;
  const sleep = options.sleep || defaultSleep;
  const now = options.now || Date.now;
  const deadline = now() + device.expiresIn * 1000;
  let interval = device.interval;

  while (now() < deadline) {
    await sleep(interval * 1000);

    const payload = await postForm<AccessTokenPayload>(
      GITHUB_ACCESS_TOKEN_URL,
      {
        client_id: clientId,
        device_code: device.deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      },
      fetchImpl
    );

    if (payload.access_token) {
      return {
        accessToken: payload.access_token,
        tokenType: payload.token_type || 'bearer',
        scope: payload.scope || '',
        createdAt: new Date(now()).toISOString(),
      };
    }

    if (payload.error === 'authorization_pending') continue;
    if (payload.error === 'slow_down') {
      interval += 5;
      continue;
    }

    throw new AuthenticationError(
      payload.error_description || 'GitHub authorization was not completed.',
      payload.error || 'authorization_failed'
    );
  }

  throw new AuthenticationError('The GitHub sign-in code expired.', 'expired_token');
}
