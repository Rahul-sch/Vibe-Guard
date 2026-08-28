import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  clearCredentials,
  getCredentialPath,
  loadCredentials,
  saveCredentials,
} from '../../src/auth/credential-store.js';

describe('credential store', () => {
  const directories: string[] = [];

  afterEach(async () => {
    await Promise.all(directories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    ));
  });

  it('saves and loads credentials with owner-only permissions', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vibeguard-auth-'));
    directories.push(directory);
    const environment = { VIBEGUARD_CONFIG_DIR: directory };
    const credentials = {
      accessToken: 'token-1',
      tokenType: 'bearer',
      scope: 'read:user',
      createdAt: '2026-08-28T00:00:00.000Z',
    };

    await saveCredentials(credentials, environment);

    await expect(loadCredentials(environment)).resolves.toEqual(credentials);
    if (process.platform !== 'win32') {
      const mode = (await stat(getCredentialPath(environment))).mode & 0o777;
      expect(mode).toBe(0o600);
    }
  });

  it('clears credentials idempotently', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'vibeguard-auth-'));
    directories.push(directory);
    const environment = { VIBEGUARD_CONFIG_DIR: directory };

    await expect(clearCredentials(environment)).resolves.toBe(false);
    await saveCredentials({
      accessToken: 'token-1', tokenType: 'bearer', scope: '', createdAt: 'now',
    }, environment);
    await expect(clearCredentials(environment)).resolves.toBe(true);
    await expect(loadCredentials(environment)).resolves.toBeNull();
  });
});
