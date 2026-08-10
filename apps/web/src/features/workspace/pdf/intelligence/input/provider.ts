/**
 * IInputProvider — Stone Runtime input abstraction.
 * Every provider emits the same TextPrimitive model.
 */

import type { DocumentInput, TextPrimitivePage, ProviderCapability } from './types';

export interface IInputProvider {
  readonly id: string;
  readonly version: string;
  readonly capabilityId: string;
  canProcess(doc: DocumentInput): boolean;
  extractText(doc: DocumentInput): TextPrimitivePage;
}

export type RegisteredProvider = {
  provider: IInputProvider;
  capability: ProviderCapability;
};
