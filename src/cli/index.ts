import { Command, Option } from 'commander';
import chalk from 'chalk';
import { VERSION, NAME } from '../index.js';
import { scanCommand } from './commands/scan.js';
import { fixCommand } from './commands/fix.js';
import { githubCommand } from './commands/github.js';
import { explainRule, explainAllRules } from './explain.js';
import {
  severityOption,
  formatOption,
  jsonOption,
  sarifOption,
  ignoreOption,
  maxFileSizeOption,
  noColorOption,
  verboseOption,
  configOption,
  aiOption,
  aiKeyOption,
  aiProviderOption,
  dryRunOption,
  yesOption,
  gitOption,
} from './options.js';

// Global error handlers - prevent raw stack traces
process.on('uncaughtException', (error) => {
  console.error(chalk.red(`\nError: ${error.message}`));
  if (process.env.DEBUG) {
    console.error(chalk.gray(error.stack || ''));
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error(chalk.red(`\nError: ${message}`));
  if (process.env.DEBUG && reason instanceof Error) {
    console.error(chalk.gray(reason.stack || ''));
  }
  process.exit(1);
});

const program = new Command();

program
  .name(NAME)
  .version(VERSION)
  .description('Regex-first security scanner for AI-generated code');

// --why flag for explaining rules
program
  .option('--why [rule-id]', 'explain a specific rule or list all rules')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.why !== undefined) {
      if (typeof opts.why === 'string') {
        console.log(explainRule(opts.why));
      } else {
        console.log(explainAllRules());
      }
      process.exit(0);
    }
  });

program
  .command('scan', { isDefault: true })
  .description('Scan a directory for security issues')
  .argument('[path]', 'directory to scan', '.')
  .addOption(severityOption)
  .addOption(formatOption)
  .addOption(jsonOption)
  .addOption(sarifOption)
  .addOption(ignoreOption)
  .addOption(maxFileSizeOption)
  .addOption(noColorOption)
  .addOption(verboseOption)
  .addOption(configOption)
  .addOption(aiOption)
  .addOption(aiKeyOption)
  .addOption(aiProviderOption)
  .option('--table', 'output results as formatted table')
  .option('--interactive', 'interactive mode: step through findings')
  .option('--benchmark', 'show scan performance metrics')
  .action(scanCommand);

program
  .command('fix')
  .description('Auto-fix security issues in code')
  .argument('[path]', 'directory to fix', '.')
  .addOption(severityOption)
  .addOption(dryRunOption)
  .addOption(yesOption)
  .addOption(gitOption)
  .addOption(verboseOption)
  .addOption(configOption)
  .addOption(aiOption)
  .addOption(aiKeyOption)
  .addOption(aiProviderOption)
  .action(fixCommand);

program
  .command('github')
  .description('GitHub integration commands')
  .argument('<action>', 'install')
  .argument('[path]', 'project directory', '.')
  .option('--no-auto-fix', 'disable automatic fixes on approval')
  .option('--severity <level>', 'minimum severity to report', 'warning')
  .option('--ai-verify', 'enable AI verification')
  .action(githubCommand);

program.parse();
