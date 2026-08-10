/**
 * Map Unified TextPrimitivePage → DocumentPrimitivePage (DOI / DPL).
 * Preserves provenance on every text primitive.
 */

import type { AdapterSource, DocumentPrimitive, DocumentPrimitivePage } from '../dpl/types';
import type { TextPrimitivePage } from './types';

export function textPrimitivePageToDpl(
  page: TextPrimitivePage,
  extras?: DocumentPrimitive[],
): DocumentPrimitivePage {
  const source: AdapterSource = {
    adapterId: page.providerId,
    format: 'pdf',
    adapterVersion: page.primitives[0]?.provenance.providerVersion ?? '1.0.0',
  };

  const primitives: DocumentPrimitive[] = page.primitives.map((p, idx) => {
    const kind = p.text.trim().length <= 1 ? 'glyph' : 'text';
    const notes = [`provider:${p.provenance.providerId}`, `source:${p.provenance.source}`];
    if (p.flags?.invisible) {
      notes.push('flag:invisible');
    }
    if (p.flags?.watermark) {
      notes.push('flag:watermark-hint');
    }
    return {
      id: `prim-${page.pageNumber}-${idx}`,
      kind,
      pageNumber: page.pageNumber,
      source,
      bbox: { ...p.bbox },
      center: {
        x: p.bbox.x + p.bbox.w / 2,
        y: p.bbox.y + p.bbox.h / 2,
      },
      rotationDeg: p.rotationDeg ?? 0,
      scale: 1,
      opacity: p.opacityHint ?? 1,
      zOrder: idx,
      text: p.text,
      unicode: p.text,
      fontSize: p.fontSize,
      fontWeight: p.fontWeight,
      textItemId: p.textItemId ?? p.id,
      extractNotes: notes,
      provenance: { ...p.provenance },
    };
  });

  if (extras?.length) {
    primitives.push(
      ...extras.map((e) => ({
        ...e,
        source: e.source ?? source,
        provenance: e.provenance ?? {
          source: 'embedded-text' as const,
          providerId: page.providerId,
          providerVersion: source.adapterVersion,
          confidence: 1,
          pageNumber: page.pageNumber,
          bbox: e.bbox,
        },
      })),
    );
  }

  return {
    pageNumber: page.pageNumber,
    pageWidth: page.pageWidth,
    pageHeight: page.pageHeight,
    primitives,
    source,
    fingerprint: page.fingerprint,
  };
}
