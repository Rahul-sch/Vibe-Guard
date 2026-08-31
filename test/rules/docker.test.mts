import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('Docker rules', () => {
  it('detects root containers, Docker socket mounts, and privileged mode', () => {
    expectMatches('VG-DOCK-001', 'FROM node:20\nRUN npm ci');
    expectNoMatch('VG-DOCK-001', 'FROM node:20\nUSER node');
    expectMatches('VG-DOCK-002', '/var/run/docker.sock:/var/run/docker.sock');
    expectNoMatch('VG-DOCK-002', '/var/run/app.sock:/var/run/app.sock');
    expectMatches('VG-DOCK-003', 'privileged: true');
    expectNoMatch('VG-DOCK-003', 'privileged: false');
  });
});
