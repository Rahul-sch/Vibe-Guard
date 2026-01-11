import { Command } from 'commander';
import { VERSION, NAME } from '../index.js';
import { scanCommand } from './commands/scan.js';
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
} from './options.js';

const program = new Command();

program
  .name(NAME)
  .version(VERSION)
  .description('Regex-first security scanner for AI-generated code');

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
  .action(scanCommand);

program.parse();
