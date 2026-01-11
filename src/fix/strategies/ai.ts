import type { Finding } from '../../rules/types.js';
import type { FixStrategy, FixResult } from '../types.js';
import type { AIProvider } from '../../ai/types.js';

/**
 * Detect language from file extension
 */
function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'yaml': 'yaml',
    'yml': 'yaml',
  };
  return languageMap[ext || ''] || 'text';
}

/**
 * Create an AI-powered fix strategy
 */
export function createAIFixStrategy(aiProvider: AIProvider): FixStrategy {
  return {
    name: 'ai-generated',

    canFix(finding: Finding, content: string): boolean {
      // AI can attempt to fix any finding with a valid snippet and match offset
      return !!(finding.snippet && finding.matchOffset !== undefined);
    },

    async generateFix(finding: Finding, content: string): Promise<FixResult> {
      if (!aiProvider.generateFix) {
        return {
          success: false,
          fix: null,
          error: 'AI provider does not support fix generation',
        };
      }

      if (!finding.matchOffset || !finding.snippet) {
        return {
          success: false,
          fix: null,
          error: 'No match offset or snippet available for AI fix',
        };
      }

      const language = detectLanguage(finding.file);

      try {
        const response = await aiProvider.generateFix({
          finding: {
            ruleId: finding.ruleId,
            message: finding.message,
            snippet: finding.snippet,
            file: finding.file,
            line: finding.line,
          },
          fileContent: content,
          language,
        });

        if (!response.success || response.confidence < 0.7) {
          return {
            success: false,
            fix: null,
            error: `AI fix confidence too low: ${response.confidence.toFixed(2)}`,
          };
        }

        // Find the exact position of the vulnerable snippet
        const snippetStart = content.indexOf(finding.snippet, finding.matchOffset);
        if (snippetStart === -1) {
          return {
            success: false,
            fix: null,
            error: 'Could not locate snippet in file',
          };
        }

        const snippetEnd = snippetStart + finding.snippet.length;

        return {
          success: true,
          fix: {
            file: finding.file,
            start: snippetStart,
            end: snippetEnd,
            original: finding.snippet,
            replacement: response.fixedCode,
            ruleId: finding.ruleId,
            description: `AI fix: ${response.explanation}`,
          },
        };
      } catch (error) {
        return {
          success: false,
          fix: null,
          error: `AI fix error: ${error instanceof Error ? error.message : 'Unknown'}`,
        };
      }
    },
  };
}
