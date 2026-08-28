import { describe, expect, it, vi } from 'vitest';
import { logoutCommand } from '../../src/cli/commands/logout.js';

describe('logout command', () => {
  it('removes the local session', async () => {
    const output = vi.fn();
    await expect(logoutCommand({
      clear: vi.fn(async () => true),
      output,
    })).resolves.toBe(true);
    expect(output).toHaveBeenCalledWith(expect.stringContaining('Signed out'));
  });

  it('is safe when the user is already signed out', async () => {
    const output = vi.fn();
    await expect(logoutCommand({
      clear: vi.fn(async () => false),
      output,
    })).resolves.toBe(false);
    expect(output).toHaveBeenCalledWith(expect.stringContaining('not signed in'));
  });
});
