import type { ScanResult } from '../rules/types.js';
import type { Reporter } from './types.js';
import { VERSION } from '../index.js';

export class JsonReporter implements Reporter {
  report(result: ScanResult): string {
    const output = {
      version: VERSION,
      timestamp: result.timestamp,
      summary: {
        scannedFiles: result.scannedFiles,
        skippedFiles: result.skippedFiles,
        critical: result.criticalCount,
        warning: result.warningCount,
        info: result.infoCount,
        duration: result.duration,
      },
      findings: result.findings.map((f) => ({
        ruleId: f.ruleId,
        title: f.title,
        severity: f.severity,
        category: f.category,
        file: f.file,
        line: f.line,
        column: f.column,
        snippet: f.snippet,
        message: f.message,
        remediation: f.remediation,
        cwe: f.cwe,
        owasp: f.owasp,
      })),
    };

    return JSON.stringify(output, null, 2);
  }
}
