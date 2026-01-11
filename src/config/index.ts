import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { VibeGuardConfig } from './defaults.js';
import { DEFAULT_CONFIG, DEFAULT_IGNORE_PATTERNS } from './defaults.js';
import type { ConfigFileSchema } from './schema.js';
import { parseSeverities, validateFormat } from './schema.js';

const CONFIG_FILENAMES = [
  'vibeguard.config.js',
  'vibeguard.config.mjs',
  'vibeguard.config.json',
  '.vibeguardrc',
  '.vibeguardrc.json',
];

export interface CLIOptions {
  severity?: string;
  format?: string;
  json?: boolean;
  sarif?: boolean;
  ignore?: string[];
  maxFileSize?: string;
  noColor?: boolean;
  verbose?: boolean;
  ai?: boolean;
  aiKey?: string;
  aiProvider?: string;
  config?: string;
}

function findConfigFile(startDir: string): string | null {
  let currentDir = resolve(startDir);
  const root = dirname(currentDir);

  while (currentDir !== root) {
    for (const filename of CONFIG_FILENAMES) {
      const configPath = resolve(currentDir, filename);
      if (existsSync(configPath)) {
        return configPath;
      }
    }
    const parent = dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }

  return null;
}

function loadConfigFile(configPath: string): ConfigFileSchema {
  const content = readFileSync(configPath, 'utf-8');

  if (configPath.endsWith('.json') || configPath.endsWith('.vibeguardrc')) {
    return JSON.parse(content) as ConfigFileSchema;
  }

  // For JS/MJS files, we'd need dynamic import - skip for MVP
  return {};
}

export function resolveConfig(
  targetPath: string,
  cliOptions: CLIOptions = {}
): VibeGuardConfig {
  // Start with defaults
  const config: VibeGuardConfig = { ...DEFAULT_CONFIG };
  config.targetPath = resolve(targetPath);
  config.ignorePatterns = [...DEFAULT_IGNORE_PATTERNS];

  // Load config file if exists
  const configPath = cliOptions.config || findConfigFile(targetPath);
  if (configPath && existsSync(configPath)) {
    const fileConfig = loadConfigFile(configPath);

    if (fileConfig.ignore) {
      config.ignorePatterns.push(...fileConfig.ignore);
    }
    if (fileConfig.maxFileSize !== undefined) {
      config.maxFileSize = fileConfig.maxFileSize;
    }
    if (fileConfig.severity) {
      config.includeSeverities = parseSeverities(fileConfig.severity);
    }
    if (fileConfig.rules) {
      config.ruleIds = fileConfig.rules;
    }
    if (fileConfig.format) {
      config.format = validateFormat(fileConfig.format);
    }
    if (fileConfig.noColor !== undefined) {
      config.noColor = fileConfig.noColor;
    }
    if (fileConfig.verbose !== undefined) {
      config.verbose = fileConfig.verbose;
    }
    if (fileConfig.ai !== undefined) {
      config.aiVerify = fileConfig.ai;
    }
    if (fileConfig.aiProvider) {
      config.aiProvider = fileConfig.aiProvider;
    }
    if (fileConfig.aiApiKey) {
      config.aiApiKey = fileConfig.aiApiKey;
    }
  }

  // CLI options override everything
  if (cliOptions.ignore) {
    config.ignorePatterns.push(...cliOptions.ignore);
  }
  if (cliOptions.maxFileSize) {
    config.maxFileSize = parseInt(cliOptions.maxFileSize, 10);
  }
  if (cliOptions.severity) {
    config.includeSeverities = parseSeverities(cliOptions.severity);
  }
  if (cliOptions.json) {
    config.format = 'json';
  } else if (cliOptions.sarif) {
    config.format = 'sarif';
  } else if (cliOptions.format) {
    config.format = validateFormat(cliOptions.format);
  }
  if (cliOptions.noColor) {
    config.noColor = true;
  }
  if (cliOptions.verbose) {
    config.verbose = true;
  }
  if (cliOptions.ai !== undefined) {
    config.aiVerify = cliOptions.ai;
  }
  if (cliOptions.aiKey) {
    config.aiApiKey = cliOptions.aiKey;
  }
  if (cliOptions.aiProvider) {
    config.aiProvider = cliOptions.aiProvider;
  }

  // Env vars for AI key
  if (!config.aiApiKey) {
    config.aiApiKey = process.env.VIBEGUARD_AI_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY;
  }

  return config;
}

export { type VibeGuardConfig, DEFAULT_CONFIG, DEFAULT_IGNORE_PATTERNS } from './defaults.js';
