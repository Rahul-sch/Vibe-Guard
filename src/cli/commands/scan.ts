import { resolve } from 'node:path';
import { scan } from '../../engine/index.js';
import { resolveConfig, type CLIOptions } from '../../config/index.js';
import { createReporter } from '../../reporters/index.js';

export interface ScanCommandOptions extends CLIOptions {
  color?: boolean;
}

export async function scanCommand(
  targetPath: string = '.',
  options: ScanCommandOptions
): Promise<void> {
  const resolvedPath = resolve(targetPath);

  // Handle --no-color (commander sets color: false)
  if (options.color === false) {
    options.noColor = true;
  }

  const config = resolveConfig(resolvedPath, options);

  if (config.verbose) {
    console.error(`VibeGuard scanning: ${config.targetPath}`);
    console.error(`Ignore patterns: ${config.ignorePatterns.length}`);
    console.error(`Max file size: ${config.maxFileSize}`);
    console.error(`Severities: ${config.includeSeverities.join(', ')}`);
    console.error(`Format: ${config.format}`);
  }

  const result = await scan(config);

  const reporter = createReporter(config.format, config.noColor);
  const output = reporter.report(result);

  console.log(output);

  // Exit codes: 0 = clean/info only, 1 = warnings, 2 = critical
  if (result.criticalCount > 0) {
    process.exitCode = 2;
  } else if (result.warningCount > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}
