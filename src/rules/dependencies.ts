import type { DetectionRule } from './types.js';

export const dependencyRules: DetectionRule[] = [
  {
    id: 'VG-DEP-001',
    title: 'Ghost Dependency (PyPI)',
    severity: 'critical',
    category: 'dependency',
    languages: ['python'],
    filePatterns: ['*.py', 'requirements.txt', 'Pipfile', 'pyproject.toml'],
    pattern: /(?:from|import)\s+(secure[-_]|enterprise[-_]|flask[-_]admin[-_]|langchain[a-z]+)/g,
    message: 'Potentially hallucinated package name. Attacker may have registered malicious package.',
    remediation: 'Verify package exists on PyPI. Check package ownership and downloads.',
    confidence: 'medium',
    cwe: 'CWE-829',
    owasp: 'A06:2021',
    aiVerification: { enabled: true },
  },
  {
    id: 'VG-DEP-002',
    title: 'Ghost Dependency (npm)',
    severity: 'critical',
    category: 'dependency',
    languages: ['node', 'typescript'],
    filePatterns: ['*.js', '*.ts', '*.mjs', '*.cjs', 'package.json'],
    pattern: /(?:require|import)\s*\(?['"](?:huggingface[-_]|@enterprise\/|react[-_]native[-_]toolkit)/g,
    message: 'Potentially hallucinated package name. Attacker may have registered malicious package.',
    remediation: 'Verify package exists on npm. Check package ownership and weekly downloads.',
    confidence: 'medium',
    cwe: 'CWE-829',
    owasp: 'A06:2021',
    aiVerification: { enabled: true },
  },
];
