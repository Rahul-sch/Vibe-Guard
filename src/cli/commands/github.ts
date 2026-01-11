import { resolve } from 'node:path';
import { installGitHubWorkflow } from '../../github/installer.js';

export interface GitHubCommandOptions {
  autoFix?: boolean;
  severity?: 'critical' | 'warning' | 'info';
  aiVerify?: boolean;
}

export async function githubCommand(
  action: string,
  targetPath: string = '.',
  options: GitHubCommandOptions
): Promise<void> {
  const resolvedPath = resolve(targetPath);

  if (action === 'install') {
    try {
      installGitHubWorkflow(resolvedPath, {
        autoFix: options.autoFix ?? true,
        severityThreshold: options.severity ?? 'warning',
        aiVerify: options.aiVerify ?? false,
      });
    } catch (error) {
      const err = error as Error;
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    }
  } else {
    console.error(`Unknown github action: ${action}`);
    console.error('Usage: vibeguard github install [path]');
    process.exitCode = 1;
  }
}
