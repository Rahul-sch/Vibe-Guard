import { describe, expect, it, vi } from 'vitest';
import { whoamiCommand } from '../../src/cli/commands/whoami.js';

describe('whoami command', () => {
  it('prints the authenticated profile', async () => {
    const output = vi.fn();
    const user = {
      login: 'octocat', id: 1, name: 'The Octocat', avatarUrl: '',
      profileUrl: 'https://github.com/octocat',
    };

    await expect(whoamiCommand({
      getUser: vi.fn(async () => user), output,
    })).resolves.toEqual(user);
    expect(output.mock.calls.flat().join('\n')).toContain('octocat');
    expect(output.mock.calls.flat().join('\n')).toContain(user.profileUrl);
  });

  it('explains how to sign in when no session exists', async () => {
    const output = vi.fn();
    await expect(whoamiCommand({
      getUser: vi.fn(async () => null), output,
    })).resolves.toBeNull();
    expect(output).toHaveBeenCalledWith(expect.stringContaining('vibeguard login'));
  });
});
