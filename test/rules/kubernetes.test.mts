import { describe, it } from 'vitest';
import { expectMatches, expectNoMatch } from './rule-test-utils.mjs';

describe('Kubernetes rules', () => {
  it('detects broad RBAC, public ingress, and root-capable contexts', () => {
    expectMatches('VG-K8S-001', 'roleRef:\n  name: cluster-admin');
    expectNoMatch('VG-K8S-001', 'roleRef:\n  name: view');
    expectMatches('VG-K8S-002', 'cidr: 0.0.0.0/0');
    expectNoMatch('VG-K8S-002', 'cidr: 10.0.0.0/8');
    expectMatches('VG-K8S-003', 'securityContext:\n  readOnlyRootFilesystem: true');
    expectNoMatch('VG-K8S-003', 'securityContext:\n  runAsNonRoot: true');
  });
});
