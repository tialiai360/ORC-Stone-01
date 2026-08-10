/**
 * Governed Capability Registry — wraps InputCapabilityRegistry with governance gates.
 */

import { InputCapabilityRegistry } from '../input/capability-registry';
import type { IInputProvider } from '../input/provider';
import type { DocumentInput } from '../input/types';
import {
  embeddedTextGovernedCapability,
  isCapabilityRunnable,
  type GovernedCapability,
} from './types';
import { createPdfTextProvider } from '../input/providers/pdf-text-provider';

export class GovernedCapabilityRegistry {
  private readonly inner = new InputCapabilityRegistry();
  private governed = new Map<string, GovernedCapability>();

  register(provider: IInputProvider, capability: GovernedCapability): void {
    this.governed.set(capability.id, { ...capability });
    this.inner.register(provider, {
      id: capability.id,
      providerId: capability.providerId,
      enabled: isCapabilityRunnable(capability),
      priority: capability.priority,
      labelVi: capability.labelVi,
    });
  }

  listGoverned(): GovernedCapability[] {
    return [...this.governed.values()].map((c) => ({ ...c }));
  }

  resolve(doc: DocumentInput): IInputProvider | null {
    return this.inner.resolve(doc);
  }

  getInner(): InputCapabilityRegistry {
    return this.inner;
  }
}

let singleton: GovernedCapabilityRegistry | null = null;

export function createDefaultGovernedRegistry(): GovernedCapabilityRegistry {
  const reg = new GovernedCapabilityRegistry();
  reg.register(createPdfTextProvider(), embeddedTextGovernedCapability());
  return reg;
}

export function getDefaultGovernedRegistry(): GovernedCapabilityRegistry {
  if (!singleton) {
    singleton = createDefaultGovernedRegistry();
  }
  return singleton;
}

export function resetDefaultGovernedRegistryForTests(): void {
  singleton = null;
}
