import type { VerifyRequest } from './types.js';

export function buildVerificationPrompt(request: VerifyRequest): string {
  return `You are a security code reviewer. Analyze the following code snippet for a potential security issue.

Rule: ${request.ruleId} - ${request.ruleTitle}
Issue: ${request.ruleDescription}
File: ${request.fileContext}

Code snippet:
\`\`\`
${request.snippet}
\`\`\`

Determine if this is a TRUE security issue or a FALSE POSITIVE.

Consider:
- Is this test/example code that won't run in production?
- Is the flagged pattern used safely with proper sanitization?
- Is there context that makes this safe (e.g., constants, trusted data)?
- Could this realistically be exploited?

Respond in JSON format:
{
  "verdict": "true_positive" | "false_positive" | "unsure",
  "confidence": 0.0-1.0,
  "rationale": "Brief explanation"
}

JSON response:`;
}

export function parseVerificationResponse(text: string): {
  verdict: 'true_positive' | 'false_positive' | 'unsure';
  confidence: number;
  rationale: string;
} {
  // Try to extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      verdict: 'unsure',
      confidence: 0.5,
      rationale: 'Failed to parse AI response',
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate verdict
    const validVerdicts = ['true_positive', 'false_positive', 'unsure'];
    const verdict = validVerdicts.includes(parsed.verdict)
      ? parsed.verdict
      : 'unsure';

    // Validate confidence
    let confidence = parseFloat(parsed.confidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      confidence = 0.5;
    }

    return {
      verdict,
      confidence,
      rationale: String(parsed.rationale || 'No rationale provided'),
    };
  } catch {
    return {
      verdict: 'unsure',
      confidence: 0.5,
      rationale: 'Failed to parse AI response JSON',
    };
  }
}
