/**
 * Capability Registry — selects an enabled IInputProvider.
 * Does not pre-declare disabled future technologies.
 */

import type { IInputProvider } from './provider';
import type { DocumentInput, ProviderCapability } from './types';

export class InputCapabilityRegistry {
  private readonly providers = new Map<string, IInputProvider>();
  private capabilities: ProviderCapability[] = [];

  register(provider: IInputProvider, capability: ProviderCapability): void {
    if (capability.providerId !== provider.id) {
      throw new Error(
        `Capability providerId mismatch: ${capability.providerId} !== ${provider.id}`,
      );
    }
    if (capability.id !== provider.capabilityId) {
      throw new Error(
        `Capability id mismatch: ${capability.id} !== ${provider.capabilityId}`,
      );
    }
    this.providers.set(provider.id, provider);
    this.capabilities = [
      ...this.capabilities.filter((c) => c.id !== capability.id),
      { ...capability },
    ];
  }

  listCapabilities(): ProviderCapability[] {
    return this.capabilities.map((c) => ({ ...c }));
  }

  listEnabledProviders(): IInputProvider[] {
    return this.capabilities
      .filter((c) => c.enabled)
      .sort((a, b) => b.priority - a.priority)
      .map((c) => this.providers.get(c.providerId))
      .filter((p): p is IInputProvider => Boolean(p));
  }

  /** Resolve first enabled provider that canProcess(doc). */
  resolve(doc: DocumentInput): IInputProvider | null {
    for (const provider of this.listEnabledProviders()) {
      if (provider.canProcess(doc)) {
        return provider;
      }
    }
    return null;
  }

  getProvider(providerId: string): IInputProvider | undefined {
    return this.providers.get(providerId);
  }
}
