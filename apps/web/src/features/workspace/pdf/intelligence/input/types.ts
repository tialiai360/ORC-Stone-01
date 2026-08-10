/**
 * Unified Text Primitive + Input contracts (Stone Runtime).
 * Technology-independent — Foundation never imports this module.
 * Capability ids are neutral (embedded-text). No engine vocabulary in contracts.
 */

export type { TextProvenance, TextSourceKind } from '../dpl/types';
import type { TextProvenance } from '../dpl/types';

export type TextPrimitive = {
  id: string;
  text: string;
  pageNumber: number;
  bbox: { x: number; y: number; w: number; h: number };
  provenance: TextProvenance;
  /** Optional link for DOM projection / region item ids. */
  textItemId?: string;
  rotationDeg?: number;
  opacityHint?: number;
  fontSize?: number;
  fontWeight?: string;
  flags?: {
    invisible?: boolean;
    orphan?: boolean;
    watermark?: boolean;
  };
};

export type TextPrimitivePage = {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  primitives: TextPrimitive[];
  fingerprint: string;
  providerId: string;
};

/**
 * Opaque document handle for providers.
 * Provider-specific keys live only in `context` (never in Foundation).
 */
export type DocumentInput = {
  documentId: string;
  mimeType?: string;
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  context: Readonly<Record<string, unknown>>;
};

export type ProviderCapability = {
  /** Neutral capability id, e.g. cap.input.embedded-text */
  id: string;
  providerId: string;
  enabled: boolean;
  priority: number;
  labelVi: string;
};
