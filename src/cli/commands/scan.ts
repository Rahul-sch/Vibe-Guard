import { resolve } from 'node:path';
import { scan } from '../../engine/index.js';
import { resolveConfig, type CLIOptions } from '../../config/index.js';
import { createReporter } from '../../reporters/index.js';
import { tableReporter } from '../../reporters/table.js';
import { verifyFindings, detectProvider } from '../../ai/index.js';
import { ruleById } from '../../rules/index.js';
import { phases, sleep } from '../spinner.js';
import { generateTelemetrySummary } from '../telemetry.js';

export interface ScanCommandOptions extends CLIOptions {
  color?: boolean;
  table?: boolean;
  demo?: boolean;
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
  const startTime = Date.now();

  // Machine-readable formats must not be polluted by spinners or telemetry on stdout.
  const machineOutput = config.format === 'json' || config.format === 'sarif';
  const showSpinners = !machineOutput && options.demo === true;

  // Phase 1: Initialize
  const initSpinner = phases.init();
  if (showSpinners) {
    initSpinner.start();
    await sleep(300);
    initSpinner.succeed('Neural Engine initialized');
  }

  // Phase 2: File scanning
  const parseSpinner = phases.parse();
  if (showSpinners) parseSpinner.start();

  let result = await scan(config);
  const scanTime = Date.now() - startTime;

  if (showSpinners) parseSpinner.succeed(`Parsed ${result.scannedFiles || 0} files in ${scanTime}ms`);

  // Phase 3: Rule matching
  const rulesSpinner = phases.rules();
  if (showSpinners) {
    rulesSpinner.start();
    await sleep(200);
    rulesSpinner.succeed(`Cross-referenced ${ruleById.size} rules (${result.findings.length} findings)`);
  }

  // Phase 4: AI verification (optional)
  if (config.aiVerify && config.aiApiKey) {
    const aiSpinner = phases.aiVerify();
    if (showSpinners) aiSpinner.start();

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

    if (showSpinners) aiSpinner.succeed(`Verified ${verifiedFindings.length} findings with AI`);
  } else if (config.aiVerify && !config.aiApiKey) {
    console.error('Warning: --ai flag set but no API key found. Set VIBEGUARD_AI_KEY or use --ai-key.');
  }

  // Use table reporter if --table flag is set (ignored for json/sarif)
  let output: string;
  if (options.table && !machineOutput) {
    output = tableReporter(result);
  } else {
    const reporter = createReporter(config.format, config.noColor);
    output = reporter.report(result);
  }

  console.log(output);

  // Show telemetry summary (skip for machine-readable formats so stdout stays parseable)
  if (!machineOutput) {
    console.log(generateTelemetrySummary(result));
  }

  // Show benchmark results
  if (options.benchmark && !machineOutput) {
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
