/**
 * EVO-004 — Derived Text Architecture (abstractions only).
 * No engine implementation. source remains 'derived-text' when used.
 */

import type { TextProvenance } from '../dpl/types';

/** How a derived text unit was produced — technology-neutral method id. */
export type DerivationMetadata = {
  derivationId: string;
  /** Opaque method tag (e.g. 'method.unspecified') — Runtime must not branch on vendors. */
  method: string;
  /** Fingerprint of inputs used for derivation (deterministic replay key). */
  inputFingerprint: string;
  producedAt: string;
  /** When true, same inputs must yield same text. */
  deterministic: boolean;
  parentPrimitiveIds?: string[];
  confidence?: number;
};

export type DerivedText = {
  id: string;
  text: string;
  pageNumber: number;
  bbox?: { x: number; y: number; w: number; h: number };
  provenance: TextProvenance;
  derivation: DerivationMetadata;
};

/** Factory for provenance of derived text (no producer attached). */
export function createDerivedProvenance(args: {
  providerId: string;
  providerVersion: string;
  pageNumber: number;
  confidence: number;
  bbox?: { x: number; y: number; w: number; h: number };
}): TextProvenance {
  return {
    source: 'derived-text',
    providerId: args.providerId,
    providerVersion: args.providerVersion,
    confidence: args.confidence,
    pageNumber: args.pageNumber,
    bbox: args.bbox,
  };
}

/**
 * Contract for a future derived-text producer plugin.
 * Intentionally unimplemented in this wave.
 */
export interface IDerivedTextProducer {
  readonly id: string;
  readonly version: string;
  /** Always false until an authorized producer is registered. */
  isEnabled(): boolean;
  produce?(...args: never[]): DerivedText[];
}
