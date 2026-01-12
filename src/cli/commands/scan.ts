import { resolve } from 'node:path';
import { scan } from '../../engine/index.js';
import { resolveConfig, type CLIOptions } from '../../config/index.js';
import { createReporter } from '../../reporters/index.js';
import { tableReporter } from '../../reporters/table.js';
import { verifyFindings, detectProvider } from '../../ai/index.js';
import { ruleById } from '../../rules/index.js';

export interface ScanCommandOptions extends CLIOptions {
  color?: boolean;
  table?: boolean;
  interactive?: boolean;
  benchmark?: boolean;
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

  const startTime = options.benchmark ? Date.now() : 0;

  if (config.verbose) {
    console.error(`VibeGuard scanning: ${config.targetPath}`);
    console.error(`Ignore patterns: ${config.ignorePatterns.length}`);
    console.error(`Max file size: ${config.maxFileSize}`);
    console.error(`Severities: ${config.includeSeverities.join(', ')}`);
    console.error(`Format: ${config.format}`);
    console.error(`AI verification: ${config.aiVerify ? 'enabled' : 'disabled'}`);
    console.error(`Total rules: ${ruleById.size}`);
  }

  let result = await scan(config);
  const scanTime = options.benchmark ? Date.now() - startTime : 0;

  // AI verification if enabled and API key available
  if (config.aiVerify && config.aiApiKey) {
    if (config.verbose) {
      console.error(`Running AI verification with ${config.aiProvider || 'auto-detected'} provider...`);
    }

    const provider = config.aiProvider || detectProvider(config.aiApiKey);
    const verifiedFindings = await verifyFindings(
      result.findings,
      ruleById,
      {
        provider,
        apiKey: config.aiApiKey,
      },
      config.verbose
    );

    result = {
      ...result,
      findings: verifiedFindings,
    };
  } else if (config.aiVerify && !config.aiApiKey) {
    console.error('Warning: --ai flag set but no API key found. Set VIBEGUARD_AI_KEY or use --ai-key.');
  }

  // Use table reporter if --table flag is set
  let output: string;
  if (options.table) {
    output = tableReporter(result);
  } else {
    const reporter = createReporter(config.format, config.noColor);
    output = reporter.report(result);
  }

  console.log(output);

  // Show benchmark results
  if (options.benchmark) {
    console.log('');
    console.log('⏱️  Performance Metrics:');
    console.log(`   Scan time: ${scanTime}ms`);
    console.log(`   Files scanned: ${result.scannedFiles || 'N/A'}`);
    console.log(`   Rules evaluated: ${ruleById.size}`);
    console.log(`   Findings: ${result.findings.length}`);
    if (result.scannedFiles) {
      console.log(`   Speed: ${(result.scannedFiles / (scanTime / 1000)).toFixed(0)} files/sec`);
    }
  }

  // Exit codes: 0 = clean/info only, 1 = warnings, 2 = critical
  if (result.criticalCount > 0) {
    process.exitCode = 2;
  } else if (result.warningCount > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}
