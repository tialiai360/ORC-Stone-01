import type { DocumentPrimitive, DocumentPrimitivePage } from '../dpl/types';
import type { ObjectFeatures } from './types';

function isReddish(c?: { r: number; g: number; b: number }): boolean {
  if (!c) {
    return false;
  }
  return c.r >= 140 && c.r > c.g + 30 && c.r > c.b + 30;
}

export function extractFeatures(page: DocumentPrimitivePage): ObjectFeatures[] {
  const { pageWidth: pw, pageHeight: ph } = page;
  return page.primitives.map((p) => featuresForPrimitive(p, pw, ph));
}

export function featuresForPrimitive(
  p: DocumentPrimitive,
  pageWidth: number,
  pageHeight: number,
): ObjectFeatures {
  const area = Math.max(0, p.bbox.w * p.bbox.h);
  const aspect = p.bbox.h > 0 ? p.bbox.w / p.bbox.h : 0;
  const cyRatio = pageHeight > 0 ? p.center.y / pageHeight : 0.5;
  const text = p.text ?? '';
  return {
    geometry: {
      x: p.bbox.x,
      y: p.bbox.y,
      w: p.bbox.w,
      h: p.bbox.h,
      cx: p.center.x,
      cy: p.center.y,
      area,
      aspect,
    },
    visual: {
      opacity: p.opacity,
      rotationDeg: p.rotationDeg,
      colorRgb: p.colorRgb,
      isReddish: isReddish(p.colorRgb),
      isLowOpacity: p.opacity > 0 && p.opacity < 0.45,
    },
    typography: {
      fontSize: p.fontSize,
      fontWeight: p.fontWeight,
      charCount: text.replace(/\s+/g, '').length,
      hasText: text.trim().length > 0,
    },
    position: {
      topBand: cyRatio < 0.18,
      bottomBand: cyRatio > 0.78,
      centerish: cyRatio >= 0.25 && cyRatio <= 0.75,
      pageWidth,
      pageHeight,
    },
    source: {
      primitiveId: p.id,
      primitiveKind: p.kind,
      textItemId: p.textItemId,
    },
  };
}
