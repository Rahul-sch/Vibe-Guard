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

export interface FixRequest {
  finding: {
    ruleId: string;
    message: string;
    snippet: string;
    file: string;
    line: number;
  };
  fileContent: string;
  language: string;
}

export interface FixResponse {
  success: boolean;
  fixedCode: string;
  explanation: string;
  confidence: number;
}

export interface AIProvider {
  name: string;
  verify(request: VerifyRequest): Promise<VerifyResponse>;
  generateFix?(request: FixRequest): Promise<FixResponse>;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  model?: string;
}
