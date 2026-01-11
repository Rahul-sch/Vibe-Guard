import type { AIProvider, AIConfig, VerifyRequest, VerifyResponse } from './types.js';
import { buildVerificationPrompt, parseVerificationResponse } from './prompts.js';

export class OpenAICompatibleProvider implements AIProvider {
  name: string;
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey;
    this.name = config.provider;

    // Set defaults based on provider
    switch (config.provider) {
      case 'anthropic':
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
        this.model = config.model || 'claude-3-haiku-20240307';
        break;
      case 'groq':
        this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = config.model || 'llama-3.1-8b-instant';
        break;
      case 'openai':
      default:
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
        this.model = config.model || 'gpt-4o-mini';
        break;
    }
  }

  async verify(request: VerifyRequest): Promise<VerifyResponse> {
    const prompt = buildVerificationPrompt(request);

    try {
      let responseText: string;

      if (this.name === 'anthropic') {
        responseText = await this.callAnthropic(prompt);
      } else {
        responseText = await this.callOpenAI(prompt);
      }

      return parseVerificationResponse(responseText);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        verdict: 'unsure',
        confidence: 0,
        rationale: `AI verification failed: ${message}`,
      };
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content || '';
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as {
      content: Array<{ text: string }>;
    };
    return data.content[0]?.text || '';
  }
}

export function createProvider(config: AIConfig): AIProvider {
  return new OpenAICompatibleProvider(config);
}
