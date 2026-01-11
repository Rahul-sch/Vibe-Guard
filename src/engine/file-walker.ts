import fg from 'fast-glob';
import * as fs from 'fs/promises';
import * as path from 'path';
import { isBinaryBuffer } from '../utils/binary-check.js';

export interface FileEntry {
  path: string;
  relativePath: string;
  size: number;
}

export interface WalkerOptions {
  targetPath: string;
  ignorePatterns: string[];
  maxFileSize: number;
}

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/.next/**',
  '**/build/**',
  '**/coverage/**',
  '**/.venv/**',
  '**/__pycache__/**',
  '**/vendor/**',
  '**/*.min.js',
  '**/*.bundle.js',
  '**/*.map',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
];

export async function walkFiles(options: WalkerOptions): Promise<FileEntry[]> {
  const { targetPath, ignorePatterns, maxFileSize } = options;

  const allIgnore = [...DEFAULT_IGNORE, ...ignorePatterns];

  const entries = await fg(['**/*'], {
    cwd: targetPath,
    ignore: allIgnore,
    onlyFiles: true,
    dot: false,
    absolute: false,
    stats: true,
  });

  const files: FileEntry[] = [];

  for (const entry of entries) {
    const stats = entry.stats;
    if (!stats || stats.size > maxFileSize) {
      continue;
    }

    files.push({
      path: path.join(targetPath, entry.path),
      relativePath: entry.path,
      size: stats.size,
    });
  }

  return files;
}

export async function readFileContent(
  filePath: string,
  maxSize: number
): Promise<string | null> {
  try {
    const buffer = await fs.readFile(filePath);

    if (buffer.length > maxSize) {
      return null;
    }

    if (isBinaryBuffer(buffer)) {
      return null;
    }

    return buffer.toString('utf-8');
  } catch {
    return null;
  }
}
