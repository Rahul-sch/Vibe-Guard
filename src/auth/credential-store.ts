import { chmod, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AuthCredentials } from './types.js';
import { AuthenticationError } from './types.js';

const CREDENTIAL_FILENAME = 'credentials.json';

export function getAuthDirectory(
  environment: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform
): string {
  if (environment.VIBEGUARD_CONFIG_DIR) return environment.VIBEGUARD_CONFIG_DIR;
  if (platform === 'win32' && environment.APPDATA) {
    return join(environment.APPDATA, 'VibeGuard');
  }
  if (environment.XDG_CONFIG_HOME) {
    return join(environment.XDG_CONFIG_HOME, 'vibeguard');
  }
  return join(homedir(), '.config', 'vibeguard');
}

export function getCredentialPath(environment: NodeJS.ProcessEnv = process.env): string {
  return join(getAuthDirectory(environment), CREDENTIAL_FILENAME);
}

export async function saveCredentials(
  credentials: AuthCredentials,
  environment: NodeJS.ProcessEnv = process.env
): Promise<void> {
  const directory = getAuthDirectory(environment);
  const credentialPath = getCredentialPath(environment);
  const temporaryPath = `${credentialPath}.${process.pid}.tmp`;

  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  await writeFile(temporaryPath, `${JSON.stringify(credentials, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await rename(temporaryPath, credentialPath);
  await chmod(credentialPath, 0o600);
}

export async function loadCredentials(
  environment: NodeJS.ProcessEnv = process.env
): Promise<AuthCredentials | null> {
  try {
    const parsed = JSON.parse(
      await readFile(getCredentialPath(environment), 'utf8')
    ) as Partial<AuthCredentials>;

    if (!parsed.accessToken || !parsed.tokenType || !parsed.createdAt) {
      throw new AuthenticationError(
        'Stored GitHub credentials are invalid. Run `vibeguard login` again.',
        'invalid_credentials'
      );
    }

    return {
      accessToken: parsed.accessToken,
      tokenType: parsed.tokenType,
      scope: parsed.scope || '',
      createdAt: parsed.createdAt,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError(
      'Stored GitHub credentials could not be read. Run `vibeguard login` again.',
      'invalid_credentials'
    );
  }
}

export async function clearCredentials(
  environment: NodeJS.ProcessEnv = process.env
): Promise<boolean> {
  try {
    await unlink(getCredentialPath(environment));
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}
