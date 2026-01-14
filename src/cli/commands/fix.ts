import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { scan } from '../../engine/index.js';
import { resolveConfig, type CLIOptions } from '../../config/index.js';
import {
  isFixable,
  getFixableFindings,
  generateFix,
  printDiff,
  applyFixes,
} from '../../fix/index.js';
import type { Fix, FixResult } from '../../fix/types.js';
import type { Finding } from '../../rules/types.js';
import { createProvider } from '../../ai/provider.js';
import { createAIFixStrategy } from '../../fix/strategies/ai.js';
import { verifyAIFixes } from '../../fix/ai-verifier.js';
import { readFileSync } from 'fs';
import { phases, sleep } from '../spinner.js';
import { formatMultipleDiffs } from '../../fix/diff-formatter.js';

export interface FixCommandOptions extends CLIOptions {
  dryRun?: boolean;
  yes?: boolean;
  git?: boolean;
}

async function promptConfirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export async function fixCommand(
  targetPath: string = '.',
  options: FixCommandOptions
): Promise<void> {
  const resolvedPath = resolve(targetPath);

  const config = resolveConfig(resolvedPath, options);

  // Phase 1: Scan for issues
  const scanSpinner = phases.scan();
  scanSpinner.start();

  const result = await scan(config);

  if (result.findings.length === 0) {
    scanSpinner.succeed('No issues found');
    return;
  }

  scanSpinner.succeed(`Found ${result.findings.length} security issues`);

  // Filter to fixable findings
  const fixable = getFixableFindings(result.findings);
  const notFixableByRegex = result.findings.filter(f => !isFixable(f));

  // Initialize AI if enabled
  let aiStrategy: ReturnType<typeof createAIFixStrategy> | null = null;
  if (config.aiVerify && config.aiApiKey) {
    const provider = createProvider({
      provider: config.aiProvider || 'openai',
      apiKey: config.aiApiKey,
    });
    aiStrategy = createAIFixStrategy(provider);
    console.log(`AI fix mode enabled (provider: ${config.aiProvider || 'openai'})\n`);
  } else if (config.aiVerify && !config.aiApiKey) {
    console.error('Error: --ai requires AI API key (VIBEGUARD_AI_KEY or --ai-key)');
    process.exitCode = 1;
    return;
  }

  if (fixable.length === 0 && !aiStrategy) {
    console.log(`Found ${result.findings.length} issues, but none are auto-fixable.`);
    return;
  }

  console.log(`${fixable.length} issues are auto-fixable via regex:\n`);

  // Phase 2: Generate fixes
  const fixSpinner = phases.fix();
  fixSpinner.start();

  const fixResults: { finding: typeof fixable[0]; result: FixResult }[] = [];
  const validFixes: Fix[] = [];

  for (const finding of fixable) {
    const fixResult = await generateFix(finding, resolvedPath);
    fixResults.push({ finding, result: fixResult });

    if (fixResult.success && fixResult.fix) {
      validFixes.push(fixResult.fix);
    }
  }

  fixSpinner.succeed(`Generated ${validFixes.length} regex fixes`);

  // Try AI fixes for non-regex-fixable findings
  const aiFixes: Array<{ fix: Fix; finding: Finding }> = [];
  if (aiStrategy && notFixableByRegex.length > 0) {
    const aiFixSpinner = phases.fix();
    aiFixSpinner.text = `Generating AI fixes for ${notFixableByRegex.length} issues...`;
    aiFixSpinner.start();

    for (const finding of notFixableByRegex) {
      const filePath = resolve(resolvedPath, finding.file);
      let content: string;
      try {
        content = readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      if (!aiStrategy.canFix(finding, content)) {
        continue;
      }

      const fixResult = await aiStrategy.generateFix(finding, content);

      if (fixResult.success && fixResult.fix) {
        aiFixes.push({ fix: fixResult.fix, finding });
      }
    }

    aiFixSpinner.succeed(`Generated ${aiFixes.length} AI fixes`);

    // Verify AI fixes
    if (aiFixes.length > 0) {
      const verifySpinner = phases.verify();
      verifySpinner.start();

      const verifiedFixes = await verifyAIFixes(aiFixes, resolvedPath);

      const rejected = aiFixes.length - verifiedFixes.length;
      if (rejected > 0) {
        verifySpinner.warn(`Verified ${verifiedFixes.length} AI fixes (${rejected} rejected)`);
      } else {
        verifySpinner.succeed(`Verified ${verifiedFixes.length} AI fixes`);
      }

      validFixes.push(...verifiedFixes);
    }
  }

  // Show what we found
  console.log('\nFix summary:');
  for (const { finding, result: fixResult } of fixResults) {
    const status = fixResult.success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`  ${status} ${finding.ruleId} ${finding.file}:${finding.line}`);

    if (!fixResult.success && fixResult.error) {
      console.log(`      \x1b[33m${fixResult.error}\x1b[0m`);
    }
  }

  if (validFixes.length === 0) {
    console.log('\nNo fixes could be generated.');
    return;
  }

  console.log(`\n${validFixes.length} fixes ready to apply.`);

  // Dry run mode - just show diffs
  if (options.dryRun) {
    console.log('\n--dry-run: Showing changes (no files will be modified):\n');
    console.log(formatMultipleDiffs(validFixes));
    console.log('\nNo changes were made (dry-run mode).');
    return;
  }

  // If not --yes, prompt for confirmation
  if (!options.yes) {
    console.log('\nProposed changes:');
    console.log(formatMultipleDiffs(validFixes));

    const confirmed = await promptConfirm('\nApply these fixes?');
    if (!confirmed) {
      console.log('Aborted.');
      return;
    }
  }

  // Group fixes by file
  const byFile = new Map<string, Fix[]>();
  for (const fix of validFixes) {
    const existing = byFile.get(fix.file) || [];
    existing.push(fix);
    byFile.set(fix.file, existing);
  }

  // Apply fixes
  let successCount = 0;
  let failCount = 0;
  const modifiedFiles: string[] = [];

  for (const [file, fileFixes] of byFile) {
    const result = applyFixes(file, fileFixes);
    if (result.applied) {
      successCount += result.fixes.length;
      modifiedFiles.push(file);
    } else if (result.error) {
      console.error(`\x1b[31mError fixing ${file}: ${result.error}\x1b[0m`);
      failCount += fileFixes.length;
    }
  }

  console.log(`\n\x1b[32m✓ ${successCount} fixes applied\x1b[0m`);
  if (failCount > 0) {
    console.log(`\x1b[31m✗ ${failCount} fixes failed\x1b[0m`);
  }

  // Git staging if requested
  if (options.git && modifiedFiles.length > 0) {
    try {
      for (const file of modifiedFiles) {
        // Security: Use spawn with argument array to prevent command injection
        const { spawnSync } = require('child_process');
        const result = spawnSync('git', ['add', file], { stdio: 'pipe', encoding: 'utf-8' });
        if (result.error) {
          throw result.error;
        }
      }
      console.log('\nChanges staged for commit.');
    } catch (error) {
      console.error('\x1b[33mWarning: Could not stage files with git.\x1b[0m');
    }
  }

  // Phase: Re-scan to verify
  const rescanSpinner = phases.scan();
  rescanSpinner.text = 'Re-scanning to verify fixes...';
  rescanSpinner.start();

  const verifyResult = await scan(config);
  const remainingFixable = getFixableFindings(verifyResult.findings);

  if (remainingFixable.length === 0) {
    rescanSpinner.succeed('All fixable issues have been resolved!');
  } else {
    rescanSpinner.warn(`${remainingFixable.length} fixable issues remain`);
  }

  // Exit code based on remaining issues
  if (verifyResult.criticalCount > 0) {
    process.exitCode = 2;
  } else if (verifyResult.warningCount > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}
