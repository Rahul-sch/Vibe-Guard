import ora, { type Ora } from 'ora';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export interface SpinnerOptions {
  text: string;
  color?: 'cyan' | 'green' | 'yellow' | 'red' | 'magenta';
}

export function createSpinner(options: SpinnerOptions): Ora {
  return ora({
    text: options.text,
    color: options.color || 'cyan',
    spinner: { frames: SPINNER_FRAMES, interval: 80 },
  });
}

// Predefined cinematic phases
export const phases = {
  init: () => createSpinner({ text: 'Initializing Neural Engine...', color: 'cyan' }),
  parse: () => createSpinner({ text: 'Parsing AST for hallucinations...', color: 'yellow' }),
  rules: () => createSpinner({ text: 'Cross-referencing security rules...', color: 'magenta' }),
  aiVerify: () => createSpinner({ text: 'Verifying findings with AI...', color: 'cyan' }),
  fix: () => createSpinner({ text: 'Generating fixes...', color: 'green' }),
  scan: () => createSpinner({ text: 'Scanning for security issues...', color: 'cyan' }),
  verify: () => createSpinner({ text: 'Verifying AI-generated fixes...', color: 'yellow' }),
};

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
