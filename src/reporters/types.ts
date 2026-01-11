import type { ScanResult } from '../rules/types.js';

export interface Reporter {
  report(result: ScanResult): string;
}

export type ReporterType = 'console' | 'json' | 'sarif';
