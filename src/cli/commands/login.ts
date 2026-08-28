import chalk from 'chalk';
import { resolveGitHubClientId } from '../../auth/config.js';
import { saveCredentials } from '../../auth/credential-store.js';
import { pollForAccessToken, requestDeviceCode } from '../../auth/device-flow.js';
import { fetchGitHubUser } from '../../auth/session.js';
import type { AuthCredentials, DeviceCodeResponse, GitHubUser } from '../../auth/types.js';

export interface LoginDependencies {
  resolveClientId: () => string;
  requestCode: (clientId: string) => Promise<DeviceCodeResponse>;
  pollForToken: (clientId: string, device: DeviceCodeResponse) => Promise<AuthCredentials>;
  save: (credentials: AuthCredentials) => Promise<void>;
  fetchUser: (accessToken: string) => Promise<GitHubUser>;
  output: (message: string) => void;
}

const defaultDependencies: LoginDependencies = {
  resolveClientId: resolveGitHubClientId,
  requestCode: requestDeviceCode,
  pollForToken: pollForAccessToken,
  save: saveCredentials,
  fetchUser: fetchGitHubUser,
  output: console.log,
};

export async function loginCommand(
  dependencies: LoginDependencies = defaultDependencies
): Promise<GitHubUser> {
  const clientId = dependencies.resolveClientId();
  const device = await dependencies.requestCode(clientId);

  dependencies.output(`Open ${chalk.cyan(device.verificationUri)} in your browser.`);
  dependencies.output(`Enter code: ${chalk.bold(device.userCode)}`);
  dependencies.output(chalk.gray('Waiting for GitHub authorization...'));

  const credentials = await dependencies.pollForToken(clientId, device);
  const user = await dependencies.fetchUser(credentials.accessToken);
  await dependencies.save(credentials);

  dependencies.output(chalk.green(`Signed in to GitHub as ${user.login}.`));
  return user;
}
