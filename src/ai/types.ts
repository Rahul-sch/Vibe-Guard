export interface VerifyRequest {
  snippet: string;
  ruleId: string;
  ruleTitle: string;
  ruleDescription: string;
  fileContext: string;
}

export interface VerifyResponse {
  verdict: 'true_positive' | 'false_positive' | 'unsure';
  confidence: number;
  rationale: string;
}

export interface AIProvider {
  name: string;
  verify(request: VerifyRequest): Promise<VerifyResponse>;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  model?: string;
}
