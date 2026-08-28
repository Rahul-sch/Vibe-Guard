import { describe, expect, it, vi } from 'vitest';
import { pollForAccessToken, requestDeviceCode } from '../../src/auth/device-flow.js';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('GitHub device flow', () => {
  it('requests and normalizes a device code', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({
      device_code: 'device-1',
      user_code: 'ABCD-EFGH',
      verification_uri: 'https://github.com/login/device',
      expires_in: 900,
      interval: 5,
    }));

    await expect(requestDeviceCode('client-1', fetchImpl)).resolves.toEqual({
      deviceCode: 'device-1',
      userCode: 'ABCD-EFGH',
      verificationUri: 'https://github.com/login/device',
      expiresIn: 900,
      interval: 5,
    });
    expect(fetchImpl.mock.calls[0][1].body).toContain('scope=read%3Auser');
  });

  it('polls pending authorization until GitHub returns a token', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'authorization_pending' }))
      .mockResolvedValueOnce(jsonResponse({
        access_token: 'secret-token',
        token_type: 'bearer',
        scope: 'read:user',
      }));
    const sleep = vi.fn(async () => undefined);

    const credentials = await pollForAccessToken('client-1', {
      deviceCode: 'device-1',
      userCode: 'ABCD-EFGH',
      verificationUri: 'https://github.com/login/device',
      expiresIn: 900,
      interval: 5,
    }, { fetchImpl, sleep, now: () => 1_000 });

    expect(credentials.accessToken).toBe('secret-token');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('surfaces denied authorization without exposing a token', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({
      error: 'access_denied',
      error_description: 'The user denied access.',
    }));

    await expect(pollForAccessToken('client-1', {
      deviceCode: 'device-1',
      userCode: 'ABCD-EFGH',
      verificationUri: 'https://github.com/login/device',
      expiresIn: 900,
      interval: 5,
    }, { fetchImpl, sleep: async () => undefined, now: () => 1_000 }))
      .rejects.toMatchObject({ code: 'access_denied' });
  });
});
