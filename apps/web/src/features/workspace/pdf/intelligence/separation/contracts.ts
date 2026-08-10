/**
 * EVO-007 — Separate Evidence / Knowledge from Presentation.
 *
 * Presentation consumes Locator (TextRegion) only.
 * Knowledge consumes Text Primitive only.
 * Evidence schema (@orc/shared) UNCHANGED — helpers map into existing text snapshots.
 */

import type { TextPrimitive } from '../input/types';
import type { TextRegion } from '../locator/types';

/** Presentation-layer hit — geometry for overlays / focus. */
export type PresentationHit = {
  kind: 'presentation';
  region: TextRegion;
  locatorId: string;
};

/** Knowledge-layer unit — text + provenance only (no DOM / locator). */
export type KnowledgeTextUnit = {
  kind: 'knowledge';
  primitiveId: string;
  text: string;
  pageNumber: number;
  provenance: TextPrimitive['provenance'];
};

export function toPresentationHit(region: TextRegion): PresentationHit {
  return {
    kind: 'presentation',
    region,
    locatorId: region.locatorId,
  };
}

export function toKnowledgeTextUnit(primitive: TextPrimitive): KnowledgeTextUnit {
  return {
    kind: 'knowledge',
    primitiveId: primitive.id,
    text: primitive.text,
    pageNumber: primitive.pageNumber,
    provenance: { ...primitive.provenance },
  };
}

/**
 * Snapshot fields compatible with existing ClassificationAssignment.text
 * without changing Review/Evidence schema.
 */
export function knowledgeTextForAssignment(unit: KnowledgeTextUnit): {
  text: string;
  pageNumber: number;
} {
  return { text: unit.text, pageNumber: unit.pageNumber };
}

/** Guard: Knowledge path must not accept PresentationHit. */
export function assertKnowledgeOnly(unit: KnowledgeTextUnit | PresentationHit): KnowledgeTextUnit {
  if (unit.kind !== 'knowledge') {
    throw new Error('EVO-007: Knowledge path rejects PresentationHit');
  }
  return unit;
}

/** Guard: Presentation path must not accept KnowledgeTextUnit as overlay source of truth. */
export function assertPresentationOnly(
  hit: KnowledgeTextUnit | PresentationHit,
): PresentationHit {
  if (hit.kind !== 'presentation') {
    throw new Error('EVO-007: Presentation path rejects KnowledgeTextUnit as hit SoT');
  }
  return hit;
}
