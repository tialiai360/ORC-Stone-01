/**
 * DPL extraction from TextItemGeom (+ optional DOM enrichment).
 * Legacy helper — prefer Input Runtime / pdf-text provider.
 */

import type { TextItemGeom } from '../../types';
import { extractAnnotationPrimitives } from './extract-annotations';
import { parseCssRgb } from './normalize';
import type { AdapterSource, DocumentPrimitive, DocumentPrimitivePage } from './types';

function fingerprintItems(items: TextItemGeom[], annCount: number): string {
  const parts = items.map(
    (i) =>
      `${i.id}:${i.text.length}:${Math.round(i.x)}:${Math.round(i.y)}:${Math.round(i.w)}:${Math.round(i.h)}`,
  );
  return `ti:${items.length}:ann:${annCount}:${parts.slice(0, 40).join('|')}`;
}

export function extractPrimitivesFromTextItems(args: {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  items: TextItemGeom[];
  source: AdapterSource;
  pageEl?: HTMLElement | null;
}): DocumentPrimitivePage {
  const { pageNumber, pageWidth, pageHeight, items, source, pageEl } = args;
  const spanByItem = new Map<string, HTMLElement>();
  if (pageEl) {
    pageEl
      .querySelectorAll<HTMLElement>('[data-orc-item-id]')
      .forEach((el) => {
        const id = el.dataset.orcItemId;
        if (id) {
          spanByItem.set(id, el);
        }
      });
  }

  const primitives: DocumentPrimitive[] = items.map((item, idx) => {
    const el = spanByItem.get(item.id);
    let colorRgb = undefined as DocumentPrimitive['colorRgb'];
    let fontFamily: string | undefined;
    let fontSize: number | undefined;
    let fontWeight: string | undefined;
    let fontStyle: string | undefined;
    if (el) {
      const cs = getComputedStyle(el);
      colorRgb = parseCssRgb(cs.color);
      fontFamily = cs.fontFamily;
      fontSize = Number.parseFloat(cs.fontSize) || undefined;
      fontWeight = cs.fontWeight;
      fontStyle = cs.fontStyle;
    }
    const notes: string[] = ['source:text-layer'];
    if (item.flags?.invisible) {
      notes.push('flag:invisible');
    }
    if (item.flags?.watermark) {
      notes.push('flag:watermark-hint');
    }
    const kind = item.text.trim().length <= 1 ? 'glyph' : 'text';
    return {
      id: `prim-${pageNumber}-${idx}`,
      kind,
      pageNumber,
      source,
      bbox: { x: item.x, y: item.y, w: item.w, h: item.h },
      center: { x: item.x + item.w / 2, y: item.y + item.h / 2 },
      rotationDeg: item.rotationDeg ?? 0,
      scale: 1,
      opacity: item.opacityHint ?? 1,
      zOrder: idx,
      text: item.text,
      unicode: item.text,
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      colorRgb,
      textItemId: item.id,
      extractNotes: notes,
      provenance: {
        source: 'embedded-text',
        providerId: source.adapterId,
        providerVersion: source.adapterVersion,
        confidence: 1,
        pageNumber,
        bbox: { x: item.x, y: item.y, w: item.w, h: item.h },
      },
    };
  });

  // Canvas as single raster proxy (image capability hint).
  if (pageEl) {
    const canvas = pageEl.querySelector('canvas');
    if (canvas) {
      primitives.push({
        id: `prim-${pageNumber}-raster`,
        kind: 'image',
        pageNumber,
        source,
        bbox: { x: 0, y: 0, w: pageWidth, h: pageHeight },
        center: { x: pageWidth / 2, y: pageHeight / 2 },
        rotationDeg: 0,
        scale: 1,
        opacity: 1,
        zOrder: -1,
        extractNotes: ['source:page-canvas', 'proxy:full-page-raster'],
      });
    }
  }

  const annotations = extractAnnotationPrimitives({
    pageNumber,
    pageWidth,
    pageHeight,
    pageEl,
    source,
  });
  primitives.push(...annotations);

  return {
    pageNumber,
    pageWidth,
    pageHeight,
    primitives,
    source,
    fingerprint: fingerprintItems(items, annotations.length),
  };
}
