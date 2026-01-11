import { writeFileSync, readFileSync } from 'fs';
import type { Finding } from '../rules/types.js';
import type { Fix } from './types.js';
import { scan } from '../engine/index.js';

/**
 * Verify that an AI-generated fix actually resolves the vulnerability
 * Returns true if the fix is valid (vulnerability is gone or severity reduced)
 */
export async function verifyAIFix(
  fix: Fix,
  originalFinding: Finding,
  basePath: string
): Promise<boolean> {
  // Read original file content
  const originalContent = readFileSync(fix.file, 'utf-8');

  // Apply fix temporarily
  const fixedContent =
    originalContent.slice(0, fix.start) + fix.replacement + originalContent.slice(fix.end);

  // Write temp content
  writeFileSync(fix.file, fixedContent);

  try {
    // Re-scan the file
    const result = await scan({
      targetPath: fix.file,
      includeSeverities: ['critical', 'warning', 'info'],
    });

    // Check if the specific vulnerability is still present
    const stillVulnerable = result.findings.some(
      (f) =>
        f.ruleId === originalFinding.ruleId &&
        Math.abs(f.line - originalFinding.line) <= 2 // Allow for line shifts
    );

    // Check if new critical vulnerabilities were introduced
    const newCritical = result.findings.filter(
      (f) =>
        f.severity === 'critical' &&
        !originalContent.includes(f.snippet) // New issue not in original
    );

    // Fix is valid if:
    // 1. Original vulnerability is gone
    // 2. No new critical vulnerabilities introduced
    return !stillVulnerable && newCritical.length === 0;
  } catch (error) {
    // If scan fails, reject the fix
    return false;
  } finally {
    // Always restore original content
    writeFileSync(fix.file, originalContent);
  }
}

/**
 * Verify multiple AI fixes
 * Returns only the fixes that pass verification
 */
export async function verifyAIFixes(
  fixes: Array<{ fix: Fix; finding: Finding }>,
  basePath: string
): Promise<Fix[]> {
  const verified: Fix[] = [];

  for (const { fix, finding } of fixes) {
    const isValid = await verifyAIFix(fix, finding, basePath);
    if (isValid) {
      verified.push(fix);
    }
  }

  return verified;
}
