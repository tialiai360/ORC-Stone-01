/**
 * EVO-005 — Capability Governance.
 * Extends capability records with state, owner, approval, policy, dependencies.
 * No derived-text / vision capability enabled.
 */

export type CapabilityState =
  | 'draft'
  | 'approved'
  | 'enabled'
  | 'disabled'
  | 'deprecated';

export type CapabilityApproval = {
  approvedBy: string;
  approvedAt: string;
  decisionRef: string;
};

export type CapabilityPolicy = {
  allowInProduction: boolean;
  requiresHumanAccept: boolean;
  /** When true, outputs must carry provenance confidence < 1. */
  markAsDerived: boolean;
};

export type GovernedCapability = {
  id: string;
  providerId: string;
  enabled: boolean;
  priority: number;
  labelVi: string;
  state: CapabilityState;
  owner: string;
  version: string;
  approval?: CapabilityApproval;
  policy: CapabilityPolicy;
  dependencies: string[];
};

export function isCapabilityRunnable(cap: GovernedCapability): boolean {
  return (
    cap.enabled &&
    (cap.state === 'enabled' || cap.state === 'approved') &&
    cap.policy.allowInProduction !== false
  );
}

/** Default governed record for embedded PDF text (production-ready). */
export function embeddedTextGovernedCapability(): GovernedCapability {
  return {
    id: 'cap.input.embedded-text',
    providerId: 'provider.pdf-text.v1',
    enabled: true,
    priority: 100,
    labelVi: 'Chữ nhúng PDF',
    state: 'enabled',
    owner: 'stone-01-runtime',
    version: '1.0.0',
    approval: {
      approvedBy: 'EVO-002c',
      approvedAt: '2026-07-21',
      decisionRef: 'docs/EVO002C_DECISION.md',
    },
    policy: {
      allowInProduction: true,
      requiresHumanAccept: false,
      markAsDerived: false,
    },
    dependencies: [],
  };
}
