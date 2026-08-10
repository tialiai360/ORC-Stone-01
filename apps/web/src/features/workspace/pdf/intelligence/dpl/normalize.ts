/**
 * Normalization Engine — deterministic coordinate / text normalization.
 */

import type { DocumentPrimitive, DocumentPrimitivePage, RgbColor } from './types';

export function normalizeUnicode(s: string): string {
  return s.normalize('NFC').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) {
    return 1;
  }
  return Math.min(1, Math.max(0, n));
}

export function normalizeRotation(deg: number): number {
  if (!Number.isFinite(deg)) {
    return 0;
  }
  let d = deg % 360;
  if (d > 180) {
    d -= 360;
  }
  if (d <= -180) {
    d += 360;
  }
  return Math.round(d * 100) / 100;
}

export function parseCssRgb(input: string | undefined): RgbColor | undefined {
  if (!input) {
    return undefined;
  }
  const m = input.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!m) {
    return undefined;
  }
  return {
    r: Math.round(Number(m[1])),
    g: Math.round(Number(m[2])),
    b: Math.round(Number(m[3])),
  };
}

export function normalizePrimitive(p: DocumentPrimitive): DocumentPrimitive {
  const text = p.text ? normalizeUnicode(p.text) : p.text;
  return {
    ...p,
    text,
    unicode: text,
    opacity: clamp01(p.opacity),
    rotationDeg: normalizeRotation(p.rotationDeg),
    scale: Number.isFinite(p.scale) && p.scale > 0 ? p.scale : 1,
    bbox: {
      x: Math.round(p.bbox.x * 100) / 100,
      y: Math.round(p.bbox.y * 100) / 100,
      w: Math.max(0, Math.round(p.bbox.w * 100) / 100),
      h: Math.max(0, Math.round(p.bbox.h * 100) / 100),
    },
    center: {
      x: Math.round(p.center.x * 100) / 100,
      y: Math.round(p.center.y * 100) / 100,
    },
  };
}

export function normalizePrimitivePage(page: DocumentPrimitivePage): DocumentPrimitivePage {
  return {
    ...page,
    primitives: page.primitives.map(normalizePrimitive),
  };
}
