import { Option } from 'commander';
import { validateSeverity, validateFormat, validateMaxFileSize } from '../config/schema.js';

export const severityOption = new Option(
  '-s, --severity <level>',
  'minimum severity level to report'
)
  .choices(['critical', 'warning', 'info'])
  .default('warning')
  .argParser(validateSeverity);

export const formatOption = new Option(
  '-f, --format <type>',
  'output format'
)
  .choices(['console', 'json', 'sarif'])
  .default('console')
  .argParser(validateFormat);

export const jsonOption = new Option(
  '--json',
  'shorthand for --format json'
);

export const sarifOption = new Option(
  '--sarif',
  'shorthand for --format sarif'
);

export const ignoreOption = new Option(
  '-i, --ignore <pattern>',
  'additional ignore patterns (can be repeated)'
);

export const maxFileSizeOption = new Option(
  '--max-file-size <bytes>',
  'skip files larger than this size'
)
  .default('1048576')
  .argParser(validateMaxFileSize);

export const noColorOption = new Option(
  '--no-color',
  'disable colored output'
);

export const verboseOption = new Option(
  '-v, --verbose',
  'show debug information'
);

export const aiOption = new Option(
  '--ai',
  'enable AI verification for flagged rules'
);

export const noAiOption = new Option(
  '--no-ai',
  'disable AI verification'
);

export const aiKeyOption = new Option(
  '--ai-key <key>',
  'API key for AI provider'
);

export const aiProviderOption = new Option(
  '--ai-provider <name>',
  'AI provider: openai, anthropic, groq'
).choices(['openai', 'anthropic', 'groq']);

export const configOption = new Option(
  '-c, --config <path>',
  'path to config file'
);

// Fix command options
export const dryRunOption = new Option(
  '--dry-run',
  'show diffs without applying changes'
);

export const yesOption = new Option(
  '-y, --yes',
  'apply fixes without prompting for confirmation'
);

export const gitOption = new Option(
  '--git',
  'stage fixed files with git add'
);
