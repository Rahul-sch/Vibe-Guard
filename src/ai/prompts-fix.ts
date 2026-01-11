import type { FixRequest, FixResponse } from './types.js';

export const SYSTEM_PROMPT_FIX = `You are a security code remediation expert. Fix security vulnerabilities while preserving functionality.

Rules:
1. Fix ONLY the security issue identified
2. Preserve all existing logic and behavior
3. Use secure patterns: parameterized queries, env vars, safe APIs
4. Return minimal changes
5. Code must be syntactically valid

Output JSON only:
{
  "fixedCode": "the fixed code snippet",
  "explanation": "one sentence what changed",
  "confidence": 0.95
}`;

export function buildFixPrompt(request: FixRequest): string {
  const { finding, fileContent, language } = request;

  // Extract context around the vulnerable line
  const lines = fileContent.split('\n');
  const startLine = Math.max(0, finding.line - 6);
  const endLine = Math.min(lines.length, finding.line + 5);
  const context = lines.slice(startLine, endLine).join('\n');

  return `${SYSTEM_PROMPT_FIX}

Fix this security vulnerability:

**Rule:** ${finding.ruleId}
**Issue:** ${finding.message}
**Language:** ${language}
**File:** ${finding.file}:${finding.line}

**Vulnerable code:**
\`\`\`${language}
${finding.snippet}
\`\`\`

**Context (lines ${startLine + 1}-${endLine}):**
\`\`\`${language}
${context}
\`\`\`

Requirements:
- Fix the security issue without breaking functionality
- Use secure alternatives (e.g., parameterized queries, process.env, JSON.parse)
- Return the fixed code snippet that replaces the vulnerable snippet
- Keep existing variable names and structure

Return JSON with fixedCode, explanation, confidence (0-1).`;
}

export function parseFixResponse(content: string): FixResponse {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch =
      content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) ||
      content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        success: false,
        fixedCode: '',
        explanation: 'Could not parse AI response',
        confidence: 0,
      };
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      fixedCode: parsed.fixedCode || '',
      explanation: parsed.explanation || 'No explanation provided',
      confidence: parsed.confidence ?? 0.5,
    };
  } catch (error) {
    return {
      success: false,
      fixedCode: '',
      explanation: `Parse error: ${error instanceof Error ? error.message : 'Unknown'}`,
      confidence: 0,
    };
  }
}
