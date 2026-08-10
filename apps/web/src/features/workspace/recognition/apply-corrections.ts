import type { ObjectInsight } from '../pdf/viewer-types';
import type { DisplayObjectInsight, ObjectCorrection } from './types';

export function objectFingerprint(
  pageNumber: number,
  objectClass: string,
  textPreview?: string,
): string {
  const t = (textPreview ?? '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 64);
  return `${pageNumber}|${objectClass}|${t}`;
}

function findCorrection(
  o: ObjectInsight,
  byId: Map<string, ObjectCorrection>,
  byFp: Map<string, ObjectCorrection>,
): ObjectCorrection | undefined {
  return (
    byId.get(o.id) ??
    byFp.get(objectFingerprint(o.pageNumber, o.class, o.textPreview))
  );
}

/**
 * Apply human corrections onto engine ObjectInsights for display only.
 * Engine output remains untouched in pageSnapshots.
 */
export function applyObjectCorrections(
  objects: ObjectInsight[],
  corrections: ObjectCorrection[],
): DisplayObjectInsight[] {
  const byId = new Map<string, ObjectCorrection>();
  const byFp = new Map<string, ObjectCorrection>();
  for (const c of corrections) {
    byId.set(c.objectId, c);
    byFp.set(c.fingerprint, c);
  }

  return objects.map((o) => {
    const c = findCorrection(o, byId, byFp);
    if (!c) {
      return {
        ...o,
        displayClass: o.class,
        rejected: false,
        confirmed: false,
        corrected: false,
        originalClass: o.class,
      };
    }
    if (c.action === 'reject') {
      return {
        ...o,
        displayClass: o.class,
        rejected: true,
        confirmed: false,
        corrected: true,
        originalClass: c.originalClass || o.class,
      };
    }
    if (c.action === 'reclass' && c.class) {
      return {
        ...o,
        class: c.class,
        displayClass: c.class,
        rejected: false,
        confirmed: false,
        corrected: true,
        originalClass: c.originalClass || o.class,
        reasons: [...o.reasons, `human-reclass:${c.originalClass}→${c.class}`].slice(0, 10),
      };
    }
    // confirm
    return {
      ...o,
      displayClass: o.class,
      rejected: false,
      confirmed: true,
      corrected: true,
      originalClass: c.originalClass || o.class,
      confidence: 'HIGH',
      confidenceScore: Math.max(o.confidenceScore, 0.92),
      reasons: [...o.reasons, 'human-confirm'].slice(0, 10),
    };
  });
}

/** Classes offered in Human Correction reclass UI (subset of DOI classes). */
export const RECLASS_OPTIONS: string[] = [
  'title',
  'subtitle',
  'heading',
  'header',
  'footer',
  'signature',
  'digital-signature',
  'seal',
  'stamp',
  'watermark',
  'qr-code',
  'barcode',
  'table',
  'logo',
  'footnote',
  'appendix',
  'annotation',
  'unknown',
];
