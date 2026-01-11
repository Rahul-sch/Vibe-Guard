import type { DetectionRule } from './types.js';

export const configRules: DetectionRule[] = [
  {
    id: 'VG-CFG-001',
    title: 'Service Bound to 0.0.0.0',
    severity: 'warning',
    category: 'config',
    languages: ['node', 'typescript', 'python'],
    filePatterns: ['*.js', '*.ts', '*.mjs', '*.cjs', '*.py'],
    pattern: /(?:host\s*[:=]\s*['"]0\.0\.0\.0['"]|\.listen\s*\([^)]*['"]0\.0\.0\.0['"])/g,
    message: 'Service binds to all interfaces. May expose internal services externally.',
    remediation: 'Bind to 127.0.0.1 for local-only services. Use reverse proxy for external access.',
    confidence: 'medium',
    cwe: 'CWE-668',
    owasp: 'A05:2021',
    aiVerification: { enabled: true },
  },
  {
    id: 'VG-CFG-002',
    title: 'Public S3 Bucket ACL',
    severity: 'critical',
    category: 'config',
    languages: ['node', 'typescript', 'python', 'yaml', 'json'],
    filePatterns: ['*.js', '*.ts', '*.py', '*.yml', '*.yaml', '*.json', '*.tf'],
    pattern: /(?:ACL['":\s]+public-read|"Principal"\s*:\s*"\*")/g,
    message: 'S3 bucket configured for public access. Data exposed to internet.',
    remediation: 'Remove public-read ACL. Use private buckets with signed URLs.',
    confidence: 'high',
    cwe: 'CWE-732',
    owasp: 'A01:2021',
  },
];
