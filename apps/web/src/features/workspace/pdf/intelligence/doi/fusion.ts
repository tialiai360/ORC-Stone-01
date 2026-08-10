/**
 * Confidence Fusion — multiple detector hits → one explainable classification.
 */

import type {
  ClassifiedObject,
  ConfidenceLevel,
  DetectorEvidence,
  ObjectClass,
  ObjectFeatures,
} from './types';

const PRIORITY: Partial<Record<ObjectClass, number>> = {
  watermark: 100,
  seal: 95,
  stamp: 94,
  signature: 90,
  'digital-signature': 90,
  'qr-code': 88,
  barcode: 87,
  title: 85,
  heading: 80,
  appendix: 78,
  attachment: 77,
  table: 70,
  header: 60,
  footer: 58,
  photo: 50,
  annotation: 45,
  'body-text': 20,
  unknown: 0,
};

function level(score: number): ConfidenceLevel {
  if (score >= 0.75) {
    return 'HIGH';
  }
  if (score >= 0.55) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function regionHintFor(
  cls: ObjectClass,
  f: ObjectFeatures,
): ClassifiedObject['regionHint'] {
  if (cls === 'header' || cls === 'title' || cls === 'logo') {
    return 'header';
  }
  if (cls === 'footer' || cls === 'signature' || cls === 'seal' || cls === 'stamp') {
    return 'footer';
  }
  if (cls === 'qr-code' || cls === 'barcode' || cls === 'annotation') {
    return f.position.bottomBand ? 'footer' : f.position.topBand ? 'header' : 'main';
  }
  if (cls === 'appendix') {
    return 'appendix';
  }
  if (cls === 'attachment') {
    return 'attachment';
  }
  if (cls === 'margin-note') {
    return 'margin';
  }
  if (f.position.topBand) {
    return 'header';
  }
  if (f.position.bottomBand) {
    return 'footer';
  }
  return 'main';
}

export function fusePrimitiveEvidence(args: {
  pageNumber: number;
  primitiveIndex: number;
  features: ObjectFeatures;
  evidence: Array<DetectorEvidence & { primitiveIndex?: number }>;
  text?: string;
  primitiveId: string;
  textItemId?: string;
}): ClassifiedObject {
  const hits = args.evidence.filter((e) => e.primitiveIndex === args.primitiveIndex);
  if (hits.length === 0) {
    return {
      id: `obj-${args.pageNumber}-${args.primitiveIndex}`,
      pageNumber: args.pageNumber,
      class: 'unknown',
      confidence: 'LOW',
      confidenceScore: 0.1,
      reasons: ['no-detector-hit'],
      evidence: [],
      features: args.features,
      primitiveIds: [args.primitiveId],
      textItemIds: args.textItemId ? [args.textItemId] : [],
      text: args.text,
      regionHint: regionHintFor('unknown', args.features),
      bbox: {
        x: args.features.geometry.x,
        y: args.features.geometry.y,
        w: args.features.geometry.w,
        h: args.features.geometry.h,
      },
    };
  }

  // Score by class with priority boost
  const byClass = new Map<ObjectClass, { score: number; reasons: string[]; evidence: DetectorEvidence[] }>();
  for (const h of hits) {
    const pri = (PRIORITY[h.classHint] ?? 10) / 100;
    const scored = h.score * 0.85 + pri * 0.15;
    const cur = byClass.get(h.classHint) ?? { score: 0, reasons: [], evidence: [] };
    cur.score = Math.max(cur.score, scored);
    cur.reasons.push(...h.reasons.map((r) => `${h.detectorId}:${r}`));
    cur.evidence.push(h);
    byClass.set(h.classHint, cur);
  }

  let bestClass: ObjectClass = 'unknown';
  let bestScore = 0;
  let bestReasons: string[] = [];
  let bestEvidence: DetectorEvidence[] = [];
  for (const [cls, v] of byClass) {
    if (v.score > bestScore) {
      bestScore = v.score;
      bestClass = cls;
      bestReasons = v.reasons;
      bestEvidence = v.evidence;
    }
  }

  return {
    id: `obj-${args.pageNumber}-${args.primitiveIndex}`,
    pageNumber: args.pageNumber,
    class: bestClass,
    confidence: level(bestScore),
    confidenceScore: Math.round(bestScore * 1000) / 1000,
    reasons: [...new Set(bestReasons)].slice(0, 12),
    evidence: bestEvidence,
    features: args.features,
    primitiveIds: [args.primitiveId],
    textItemIds: args.textItemId ? [args.textItemId] : [],
    text: args.text,
    regionHint: regionHintFor(bestClass, args.features),
    bbox: {
      x: args.features.geometry.x,
      y: args.features.geometry.y,
      w: args.features.geometry.w,
      h: args.features.geometry.h,
    },
  };
}
