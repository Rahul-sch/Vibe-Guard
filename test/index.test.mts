import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { VERSION, NAME } from '../src/index.js';

const pkg = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf-8')
) as { version: string };

describe('vibeguard', () => {
  it('exports version matching package.json', () => {
    expect(VERSION).toBe(pkg.version);
  });

  it('exports name', () => {
    expect(NAME).toBe('vibeguard');
  });
});
