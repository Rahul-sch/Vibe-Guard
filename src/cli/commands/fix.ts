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

  if (config.verbose) {
    console.error(`VibeGuard fix: ${config.targetPath}`);
  }

  // First, scan to find issues
  const result = await scan(config);

  if (result.findings.length === 0) {
    console.log('No issues found.');
    return;
  }

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

  console.log(`Found ${result.findings.length} issues, ${fixable.length} are auto-fixable via regex:\n`);

  // Generate regex-based fixes
  const fixResults: { finding: typeof fixable[0]; result: FixResult }[] = [];
  const validFixes: Fix[] = [];

  for (const finding of fixable) {
    const fixResult = await generateFix(finding, resolvedPath);
    fixResults.push({ finding, result: fixResult });

    if (fixResult.success && fixResult.fix) {
      validFixes.push(fixResult.fix);
    }
  }

  // Try AI fixes for non-regex-fixable findings
  const aiFixes: Array<{ fix: Fix; finding: Finding }> = [];
  if (aiStrategy && notFixableByRegex.length > 0) {
    console.log(`\nAttempting AI fixes for ${notFixableByRegex.length} remaining issues...\n`);

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
      const status = fixResult.success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      console.log(`  ${status} ${finding.ruleId} ${finding.file}:${finding.line}`);

      if (fixResult.success && fixResult.fix) {
        aiFixes.push({ fix: fixResult.fix, finding });
      } else if (fixResult.error) {
        console.log(`      \x1b[33m${fixResult.error}\x1b[0m`);
      }
    }

    // Verify AI fixes
    if (aiFixes.length > 0) {
      console.log(`\nVerifying ${aiFixes.length} AI-generated fixes...`);
      const verifiedFixes = await verifyAIFixes(aiFixes, resolvedPath);

      const rejected = aiFixes.length - verifiedFixes.length;
      if (rejected > 0) {
        console.log(`\x1b[33m⚠ Rejected ${rejected} AI fixes that failed verification\x1b[0m`);
      }

      validFixes.push(...verifiedFixes);
    }
  }

  // Show what we found
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
    console.log('\n--dry-run: Showing diffs only:\n');
    for (const fix of validFixes) {
      console.log(printDiff(fix));
    }
    console.log('\nNo changes were made (dry-run mode).');
    return;
  }

  // If not --yes, prompt for confirmation
  if (!options.yes) {
    console.log('\nDiffs:');
    for (const fix of validFixes) {
      console.log(printDiff(fix));
    }

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
        execSync(`git add "${file}"`, { stdio: 'pipe' });
      }
      console.log('\nChanges staged for commit.');
    } catch (error) {
      console.error('\x1b[33mWarning: Could not stage files with git.\x1b[0m');
    }
  }

  // Show verification
  console.log('\nRe-scanning to verify fixes...');
  const verifyResult = await scan(config);
  const remainingFixable = getFixableFindings(verifyResult.findings);

  if (remainingFixable.length === 0) {
    console.log('\x1b[32m✓ All fixable issues have been resolved!\x1b[0m');
  } else {
    console.log(`\x1b[33m${remainingFixable.length} fixable issues remain.\x1b[0m`);
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
