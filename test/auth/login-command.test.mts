import { describe, expect, it, vi } from 'vitest';
import { loginCommand } from '../../src/cli/commands/login.js';

describe('login command', () => {
  it('completes device authorization and persists the token', async () => {
    const output = vi.fn();
    const save = vi.fn(async () => undefined);
    const credentials = {
      accessToken: 'secret-token', tokenType: 'bearer', scope: 'read:user', createdAt: 'now',
    };
    const device = {
      deviceCode: 'device-1', userCode: 'ABCD-EFGH',
      verificationUri: 'https://github.com/login/device', expiresIn: 900, interval: 5,
    };

    const user = await loginCommand({
      resolveClientId: () => 'client-1',
      requestCode: vi.fn(async () => device),
      pollForToken: vi.fn(async () => credentials),
      save,
      fetchUser: vi.fn(async () => ({
        login: 'octocat', id: 1, name: null, avatarUrl: '', profileUrl: '',
      })),
      output,
    });

    expect(user.login).toBe('octocat');
    expect(save).toHaveBeenCalledWith(credentials);
    expect(output.mock.calls.flat().join('\n')).toContain('ABCD-EFGH');
    expect(output.mock.calls.flat().join('\n')).not.toContain('secret-token');
  });

  it('does not save a token that fails user verification', async () => {
    const save = vi.fn(async () => undefined);

    await expect(loginCommand({
      resolveClientId: () => 'client-1',
      requestCode: vi.fn(async () => ({
        deviceCode: 'device-1', userCode: 'CODE', verificationUri: 'https://example.com',
        expiresIn: 900, interval: 5,
      })),
      pollForToken: vi.fn(async () => ({
        accessToken: 'bad-token', tokenType: 'bearer', scope: '', createdAt: 'now',
      })),
      save,
      fetchUser: vi.fn(async () => { throw new Error('invalid token'); }),
      output: vi.fn(),
    })).rejects.toThrow('invalid token');

    expect(save).not.toHaveBeenCalled();
  });
});
