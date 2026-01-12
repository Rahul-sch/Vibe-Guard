import { describe, it, expect } from 'vitest';
import { VERSION, NAME } from '../src/index.js';

describe('vibeguard', () => {
  it('exports version', () => {
    expect(VERSION).toBe('1.0.1');
  });

  it('exports name', () => {
    expect(NAME).toBe('vibeguard');
  });
});
