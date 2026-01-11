import type { Finding } from '../rules/types.js';
import type { FixStrategy, FixResult } from './types.js';

/**
 * Strategy: eval(x) -> JSON.parse(x)
 * Works for both JS and Python
 */
export const evalToJsonParse: FixStrategy = {
  name: 'eval-to-json-parse',

  canFix(finding: Finding, content: string): boolean {
    // Must have a valid match offset
    if (finding.matchOffset === undefined) return false;
    // Must contain eval(
    return /\beval\s*\(/.test(finding.match);
  },

  generateFix(finding: Finding, content: string): FixResult {
    if (finding.matchOffset === undefined) {
      return { success: false, fix: null, error: 'No match offset available' };
    }

    const start = finding.matchOffset;
    const matchLen = finding.match.length;

    // Find the full eval(...) call including the closing paren
    // We need to find the matching closing parenthesis
    let depth = 0;
    let endPos = start;
    let foundOpen = false;

    for (let i = start; i < content.length; i++) {
      const char = content[i];
      if (char === '(') {
        depth++;
        foundOpen = true;
      } else if (char === ')') {
        depth--;
        if (foundOpen && depth === 0) {
          endPos = i + 1;
          break;
        }
      }
    }

    if (endPos <= start) {
      return { success: false, fix: null, error: 'Could not find closing parenthesis' };
    }

    const original = content.slice(start, endPos);
    // Extract the argument: eval(arg) -> arg
    const argMatch = original.match(/\beval\s*\(([\s\S]*)\)$/);
    if (!argMatch) {
      return { success: false, fix: null, error: 'Could not parse eval argument' };
    }

    const arg = argMatch[1];
    const replacement = `JSON.parse(${arg})`;

    return {
      success: true,
      fix: {
        file: finding.file,
        start,
        end: endPos,
        original,
        replacement,
        ruleId: finding.ruleId,
        description: 'Replace eval() with JSON.parse()',
      },
    };
  },
};

/**
 * Strategy: hardcoded secret -> environment variable
 * Handles both JS (process.env) and Python (os.environ.get)
 */
export const hardcodedToEnv: FixStrategy = {
  name: 'hardcoded-to-env',

  canFix(finding: Finding, content: string): boolean {
    if (finding.matchOffset === undefined) return false;
    // Must be an assignment with a string value
    return /(?:api[_-]?key|secret|password|token|auth[_-]?token|private[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(finding.match);
  },

  generateFix(finding: Finding, content: string): FixResult {
    if (finding.matchOffset === undefined) {
      return { success: false, fix: null, error: 'No match offset available' };
    }

    const start = finding.matchOffset;
    const original = finding.match;
    const end = start + original.length;

    // Extract the variable name
    const varMatch = original.match(/^(\w+)\s*[:=]/);
    if (!varMatch) {
      return { success: false, fix: null, error: 'Could not extract variable name' };
    }

    const varName = varMatch[1];
    const envVarName = toScreamingSnakeCase(varName);

    // Detect language from file extension
    const isPython = finding.file.endsWith('.py');
    const isJS = /\.(js|ts|jsx|tsx|mjs|cjs)$/.test(finding.file);

    let replacement: string;
    if (isPython) {
      // Python: api_key = os.environ.get("API_KEY")
      replacement = `${varName} = os.environ.get("${envVarName}")`;
    } else if (isJS) {
      // JavaScript: const token = process.env.TOKEN
      // Preserve the declaration keyword if present
      const declMatch = original.match(/^(const|let|var)\s+/);
      const prefix = declMatch ? declMatch[1] + ' ' : '';
      replacement = `${prefix}${varName} = process.env.${envVarName}`;
    } else {
      return { success: false, fix: null, error: 'Unsupported file type' };
    }

    return {
      success: true,
      fix: {
        file: finding.file,
        start,
        end,
        original,
        replacement,
        ruleId: finding.ruleId,
        description: `Replace hardcoded value with ${isPython ? 'os.environ.get' : 'process.env'}.${envVarName}`,
      },
    };
  },
};

/**
 * Strategy: shell=True -> shell=False
 */
export const shellTrueToFalse: FixStrategy = {
  name: 'shell-true-to-false',

  canFix(finding: Finding, content: string): boolean {
    if (finding.matchOffset === undefined) return false;
    return /shell\s*=\s*True/i.test(finding.match);
  },

  generateFix(finding: Finding, content: string): FixResult {
    if (finding.matchOffset === undefined) {
      return { success: false, fix: null, error: 'No match offset available' };
    }

    const start = finding.matchOffset;
    const original = finding.match;
    const end = start + original.length;

    // Replace shell=True with shell=False
    const replacement = original.replace(/shell\s*=\s*True/i, 'shell=False');

    if (replacement === original) {
      return { success: false, fix: null, error: 'Could not find shell=True to replace' };
    }

    return {
      success: true,
      fix: {
        file: finding.file,
        start,
        end,
        original,
        replacement,
        ruleId: finding.ruleId,
        description: 'Set shell=False (command may need to be split into list)',
      },
    };
  },
};

/**
 * Strategy: Remove verify=False from requests calls
 */
export const removeVerifyFalse: FixStrategy = {
  name: 'remove-verify-false',

  canFix(finding: Finding, content: string): boolean {
    if (finding.matchOffset === undefined) return false;
    return /verify\s*=\s*False/i.test(finding.match);
  },

  generateFix(finding: Finding, content: string): FixResult {
    if (finding.matchOffset === undefined) {
      return { success: false, fix: null, error: 'No match offset available' };
    }

    const start = finding.matchOffset;
    const original = finding.match;
    const end = start + original.length;

    // Remove verify=False (and any preceding comma+space or following comma+space)
    let replacement = original.replace(/,\s*verify\s*=\s*False/i, '');
    if (replacement === original) {
      replacement = original.replace(/verify\s*=\s*False\s*,?\s*/i, '');
    }

    if (replacement === original) {
      return { success: false, fix: null, error: 'Could not remove verify=False' };
    }

    return {
      success: true,
      fix: {
        file: finding.file,
        start,
        end,
        original,
        replacement,
        ruleId: finding.ruleId,
        description: 'Remove verify=False to enable SSL verification',
      },
    };
  },
};

// Helper function
function toScreamingSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]/g, '_')
    .toUpperCase();
}

// Strategy registry
export const strategies: Map<string, FixStrategy> = new Map([
  ['eval-to-json-parse', evalToJsonParse],
  ['hardcoded-to-env', hardcodedToEnv],
  ['shell-true-to-false', shellTrueToFalse],
  ['remove-verify-false', removeVerifyFalse],
]);

export function getStrategy(name: string): FixStrategy | undefined {
  return strategies.get(name);
}
