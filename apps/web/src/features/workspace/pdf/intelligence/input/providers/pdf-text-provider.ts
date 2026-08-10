/**
 * PDF embedded-text provider — reads already-embedded page text (DOM or geom items).
 * Provider-private knowledge of page DOM stays here; Runtime consumers see TextPrimitive only.
 */

import { collectItemsFromTextLayer } from '../../../geometry';
import type { TextItemGeom } from '../../../types';
import type { IInputProvider } from '../provider';
import type { DocumentInput, TextPrimitive, TextPrimitivePage } from '../types';

export const PDF_TEXT_PROVIDER_ID = 'provider.pdf-text.v1';
export const PDF_TEXT_CAPABILITY_ID = 'cap.input.embedded-text';
export const PDF_TEXT_PROVIDER_VERSION = '1.0.0';

function asTextItems(value: unknown): TextItemGeom[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value as TextItemGeom[];
}

function asPageEl(value: unknown): HTMLElement | null {
  if (typeof HTMLElement === 'undefined') {
    return null;
  }
  return value instanceof HTMLElement ? value : null;
}

function fingerprint(items: TextItemGeom[]): string {
  const parts = items.map(
    (i) =>
      `${i.id}:${i.text.length}:${Math.round(i.x)}:${Math.round(i.y)}:${Math.round(i.w)}:${Math.round(i.h)}`,
  );
  return `pdf-text:${items.length}:${parts.slice(0, 40).join('|')}`;
}

function toPrimitives(
  items: TextItemGeom[],
  pageNumber: number,
): TextPrimitive[] {
  return items.map((item) => ({
    id: item.id,
    text: item.text,
    pageNumber,
    bbox: { x: item.x, y: item.y, w: item.w, h: item.h },
    textItemId: item.id,
    rotationDeg: item.rotationDeg,
    opacityHint: item.opacityHint,
    flags: item.flags ? { ...item.flags } : undefined,
    provenance: {
      source: 'embedded-text',
      providerId: PDF_TEXT_PROVIDER_ID,
      providerVersion: PDF_TEXT_PROVIDER_VERSION,
      confidence: 1,
      pageNumber,
      bbox: { x: item.x, y: item.y, w: item.w, h: item.h },
      engine: 'pdf-embedded-text',
    },
  }));
}

export function createPdfTextProvider(): IInputProvider {
  return {
    id: PDF_TEXT_PROVIDER_ID,
    version: PDF_TEXT_PROVIDER_VERSION,
    capabilityId: PDF_TEXT_CAPABILITY_ID,
    canProcess(doc: DocumentInput): boolean {
      if (Object.prototype.hasOwnProperty.call(doc.context, 'textItems')) {
        return true;
      }
      return asPageEl(doc.context.pageEl) != null;
    },
    extractText(doc: DocumentInput): TextPrimitivePage {
      let items = asTextItems(doc.context.textItems);
      let pageWidth = doc.pageWidth;
      let pageHeight = doc.pageHeight;
      const pageEl = asPageEl(doc.context.pageEl);

      if ((!items || items.length === 0) && pageEl) {
        const collected = collectItemsFromTextLayer(pageEl);
        items = collected.items;
        pageWidth = collected.pageWidth || pageWidth;
        pageHeight = collected.pageHeight || pageHeight;
      }

      const safeItems = items ?? [];
      const primitives = toPrimitives(safeItems, doc.pageNumber);

      return {
        pageNumber: doc.pageNumber,
        pageWidth: pageWidth || 1,
        pageHeight: pageHeight || 1,
        primitives,
        fingerprint: fingerprint(safeItems),
        providerId: PDF_TEXT_PROVIDER_ID,
      };
    },
  };
}

/** Bridge TextPrimitivePage → TextItemGeom for region/selection pipeline. */
export function textPrimitivePageToGeomItems(page: TextPrimitivePage): TextItemGeom[] {
  return page.primitives
    .filter((p) => p.textItemId || p.text.trim().length > 0)
    .map((p) => ({
      id: p.textItemId ?? p.id,
      text: p.text,
      x: p.bbox.x,
      y: p.bbox.y,
      w: p.bbox.w,
      h: p.bbox.h,
      rotationDeg: p.rotationDeg,
      opacityHint: p.opacityHint,
      flags: p.flags ? { ...p.flags } : undefined,
    }));
}
