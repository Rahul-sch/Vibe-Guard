import chalk from 'chalk';
import { getCurrentUser } from '../../auth/session.js';
import type { GitHubUser } from '../../auth/types.js';

export interface WhoamiDependencies {
  getUser: () => Promise<GitHubUser | null>;
  output: (message: string) => void;
}

const defaultDependencies: WhoamiDependencies = {
  getUser: getCurrentUser,
  output: console.log,
};

export async function whoamiCommand(
  dependencies: WhoamiDependencies = defaultDependencies
): Promise<GitHubUser | null> {
  const user = await dependencies.getUser();

  if (!user) {
    dependencies.output(chalk.yellow('Not signed in. Run `vibeguard login`.'));
    return null;
  }

  dependencies.output(chalk.green(`Signed in as ${user.login}`));
  if (user.name) dependencies.output(user.name);
  dependencies.output(user.profileUrl);
  return user;
}
