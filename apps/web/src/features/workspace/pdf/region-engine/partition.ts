/**
 * Default geometric page partition — Header / Main / Footer / Margin bands.
 * Runs before specialized detectors. Heuristic only (no OCR/AI).
 */

import { boundsOf } from '../geometry';
import type { TextItemGeom, TextLine } from '../types';
import type { DocumentRegion, RegionDetectorContext } from './types';
import { REGION_LABELS_VI } from './types';

function itemsInBand(
  items: TextItemGeom[],
  y0: number,
  y1: number,
): TextItemGeom[] {
  return items.filter((i) => {
    const cy = i.y + i.h / 2;
    return cy >= y0 && cy < y1;
  });
}

function leftMarginItems(items: TextItemGeom[], pageWidth: number): TextItemGeom[] {
  const edge = pageWidth * 0.08;
  return items.filter((i) => i.x + i.w < edge && i.text.trim().length > 0);
}

export function partitionDefaultBands(ctx: RegionDetectorContext): DocumentRegion[] {
  const { pageHeight, pageWidth, pageNumber, items } = ctx;
  const headerY = pageHeight * 0.14;
  const footerY = pageHeight * 0.86;

  const headerItems = itemsInBand(items, 0, headerY);
  const footerItems = itemsInBand(items, footerY, pageHeight + 1);
  const marginItems = leftMarginItems(items, pageWidth).filter(
    (i) => !headerItems.includes(i) && !footerItems.includes(i),
  );
  const claimed = new Set([
    ...headerItems.map((i) => i.id),
    ...footerItems.map((i) => i.id),
    ...marginItems.map((i) => i.id),
  ]);
  const mainItems = items.filter((i) => !claimed.has(i.id));

  const mk = (
    kind: DocumentRegion['kind'],
    bandItems: TextItemGeom[],
    y0: number,
    y1: number,
    excludeRo: boolean,
  ): DocumentRegion => {
    const box =
      bandItems.length > 0
        ? boundsOf(bandItems)
        : { x: 0, y: y0, w: pageWidth, h: Math.max(1, y1 - y0) };
    return {
      id: `region-${kind}-${pageNumber}`,
      kind,
      labelVi: REGION_LABELS_VI[kind],
      pageNumber,
      itemIds: bandItems.map((i) => i.id),
      confidence: bandItems.length > 0 ? 'MEDIUM' : 'LOW',
      excludeFromDocumentReadingOrder: excludeRo,
      selectable: true,
      objects: [],
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      notes: bandItems.length === 0 ? ['empty-band'] : undefined,
    };
  };

  return [
    mk('header', headerItems, 0, headerY, true),
    mk('main', mainItems, headerY, footerY, false),
    mk('footer', footerItems, footerY, pageHeight, true),
    ...(marginItems.length > 0
      ? [mk('margin', marginItems, headerY, footerY, true)]
      : []),
  ];
}

/** Refine header/footer confidence using Vietnamese admin cues. */
export function refineBandConfidence(
  regions: DocumentRegion[],
  lines: TextLine[],
): DocumentRegion[] {
  return regions.map((r) => {
    if (r.kind !== 'header' && r.kind !== 'footer') {
      return r;
    }
    const text = lines
      .filter((l) => l.items.some((i) => r.itemIds.includes(i.id)))
      .map((l) => l.text)
      .join(' ');
    let confidence = r.confidence;
    if (r.kind === 'header') {
      if (/cộng\s*hòa|độc\s*lập|v\/v|số\s*:/i.test(text)) {
        confidence = 'HIGH';
      }
    }
    if (r.kind === 'footer') {
      if (/nơi\s*nhận|trang\s*\d+|chữ\s*ký/i.test(text)) {
        confidence = 'HIGH';
      }
    }
    return { ...r, confidence };
  });
}
