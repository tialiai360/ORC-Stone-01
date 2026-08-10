/**
 * Default Capability Registry — only embedded PDF text provider enabled.
 * No disabled future-technology slots are declared.
 */

import { InputCapabilityRegistry } from './capability-registry';
import {
  createPdfTextProvider,
  PDF_TEXT_CAPABILITY_ID,
  PDF_TEXT_PROVIDER_ID,
} from './providers/pdf-text-provider';

let singleton: InputCapabilityRegistry | null = null;

export function createDefaultInputRegistry(): InputCapabilityRegistry {
  const registry = new InputCapabilityRegistry();
  const provider = createPdfTextProvider();
  registry.register(provider, {
    id: PDF_TEXT_CAPABILITY_ID,
    providerId: PDF_TEXT_PROVIDER_ID,
    enabled: true,
    priority: 100,
    labelVi: 'Chữ nhúng PDF',
  });
  return registry;
}

export function getDefaultInputRegistry(): InputCapabilityRegistry {
  if (!singleton) {
    singleton = createDefaultInputRegistry();
  }
  return singleton;
}

/** Test helper — drop singleton. */
export function resetDefaultInputRegistryForTests(): void {
  singleton = null;
}
