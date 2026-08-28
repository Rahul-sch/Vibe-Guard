import chalk from 'chalk';
import { clearCredentials } from '../../auth/credential-store.js';

export interface LogoutDependencies {
  clear: () => Promise<boolean>;
  output: (message: string) => void;
}

const defaultDependencies: LogoutDependencies = {
  clear: clearCredentials,
  output: console.log,
};

export async function logoutCommand(
  dependencies: LogoutDependencies = defaultDependencies
): Promise<boolean> {
  const cleared = await dependencies.clear();

  dependencies.output(cleared
    ? chalk.green('Signed out of GitHub.')
    : chalk.yellow('You are not signed in.'));

  return cleared;
}
