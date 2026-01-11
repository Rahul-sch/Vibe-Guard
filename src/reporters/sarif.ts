import type { ScanResult, Finding } from '../rules/types.js';
import type { Reporter } from './types.js';
import { VERSION } from '../index.js';
import { allRules } from '../rules/index.js';

interface SarifResult {
  ruleId: string;
  level: 'error' | 'warning' | 'note';
  message: { text: string };
  locations: Array<{
    physicalLocation: {
      artifactLocation: { uri: string };
      region: { startLine: number; startColumn: number };
    };
  }>;
}

interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  fullDescription?: { text: string };
  help?: { text: string };
  properties?: {
    security_severity?: string;
    tags?: string[];
  };
}

export class SarifReporter implements Reporter {
  report(result: ScanResult): string {
    const rules = this.buildRules(result.findings);
    const results = this.buildResults(result.findings);

    const sarif = {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'VibeGuard',
              version: VERSION,
              informationUri: 'https://github.com/vibeguard/vibeguard',
              rules,
            },
          },
          results,
        },
      ],
    };

    return JSON.stringify(sarif, null, 2);
  }

  private buildRules(findings: Finding[]): SarifRule[] {
    const ruleIds = [...new Set(findings.map((f) => f.ruleId))];

    return ruleIds.map((id) => {
      const rule = allRules.find((r) => r.id === id);
      const finding = findings.find((f) => f.ruleId === id);

      return {
        id,
        name: rule?.title || finding?.title || id,
        shortDescription: { text: rule?.message || finding?.message || '' },
        fullDescription: rule?.remediation ? { text: rule.remediation } : undefined,
        properties: {
          security_severity: this.getSeverityScore(finding?.severity || 'info'),
          tags: rule?.cwe ? [rule.cwe] : [],
        },
      };
    });
  }

  private buildResults(findings: Finding[]): SarifResult[] {
    return findings.map((f) => ({
      ruleId: f.ruleId,
      level: this.mapSeverity(f.severity),
      message: { text: `${f.message}\n\nSnippet: ${f.snippet}` },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: f.file },
            region: { startLine: f.line, startColumn: f.column },
          },
        },
      ],
    }));
  }

  private mapSeverity(severity: string): 'error' | 'warning' | 'note' {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'note';
    }
  }

  private getSeverityScore(severity: string): string {
    switch (severity) {
      case 'critical':
        return '9.0';
      case 'warning':
        return '6.0';
      default:
        return '3.0';
    }
  }
}
