/**
 * Peel chrome layers (watermark / signature / stamp) for clean reading.
 * Display stays hidden; watermark may enter Knowledge as provenance (human confirm).
 * Signature/stamp: peel & hide only — not reused in library by default.
 */

import type { PageStructureSnapshot } from '../pdf/viewer-types';
import type { FieldSuggestion } from './suggest-knowledge-fields';

export type PeeledChromeKind = 'watermark' | 'signature' | 'stamp' | 'rotated-text';

export type PeeledChromeItem = {
  id: string;
  kind: PeeledChromeKind;
  labelVi: string;
  text: string;
  pageNumber: number;
  /** Offer Accept into Knowledge (watermark provenance). */
  saveToKnowledge: boolean;
  nodeId?: FieldSuggestion['nodeId'];
};

const KIND_META: Record<
  PeeledChromeKind,
  { labelVi: string; saveToKnowledge: boolean; nodeId?: FieldSuggestion['nodeId'] }
> = {
  watermark: {
    labelVi: 'Watermark / nguồn bản',
    saveToKnowledge: true,
    nodeId: 'thong-tin-van-ban',
  },
  'rotated-text': {
    labelVi: 'Chữ xoay (đã bóc)',
    saveToKnowledge: true,
    nodeId: 'thong-tin-van-ban',
  },
  signature: {
    labelVi: 'Chữ ký (đã ẩn)',
    saveToKnowledge: false,
  },
  stamp: {
    labelVi: 'Con dấu (đã ẩn)',
    saveToKnowledge: false,
  },
};

function moduleToKind(moduleId: string | undefined, kind: string): PeeledChromeKind | null {
  if (moduleId === 'watermark' || kind === 'watermark') {
    return 'watermark';
  }
  if (moduleId === 'rotated-text') {
    return 'rotated-text';
  }
  if (moduleId === 'signature' || kind === 'signature') {
    return 'signature';
  }
  if (moduleId === 'stamp' || kind === 'stamp') {
    return 'stamp';
  }
  if (moduleId === 'digital-signature') {
    return 'signature';
  }
  return null;
}

export function collectPeeledChrome(
  snapshots: PageStructureSnapshot[],
): PeeledChromeItem[] {
  const out: PeeledChromeItem[] = [];
  const seen = new Set<string>();

  for (const snap of Object.values(
    Object.fromEntries(snapshots.map((s) => [s.pageNumber, s])),
  )) {
    for (const r of snap.regions ?? []) {
      const k = moduleToKind(r.moduleId, r.kind);
      if (!k) {
        continue;
      }
      const text = (r.text ?? '').replace(/\s+/g, ' ').trim();
      if (text.length < 2) {
        continue;
      }
      const key = `${k}|${snap.pageNumber}|${text.slice(0, 80)}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const meta = KIND_META[k];
      out.push({
        id: `peel-${key}`,
        kind: k,
        labelVi: meta.labelVi,
        text: text.slice(0, 240),
        pageNumber: snap.pageNumber,
        saveToKnowledge: meta.saveToKnowledge,
        nodeId: meta.nodeId,
      });
    }
  }

  return out.sort((a, b) => a.pageNumber - b.pageNumber || a.kind.localeCompare(b.kind));
}

/** Watermark / rotated peel → FieldSuggestion for confirm→library. */
export function peeledToFieldSuggestions(
  peeled: PeeledChromeItem[],
  existingAssignments: { nodeId: string; text: string }[],
): FieldSuggestion[] {
  const filled = new Set(
    existingAssignments.map((a) => `${a.nodeId}|${a.text.replace(/\s+/g, ' ').trim()}`),
  );
  const out: FieldSuggestion[] = [];
  for (const p of peeled) {
    if (!p.saveToKnowledge || !p.nodeId) {
      continue;
    }
    const key = `${p.nodeId}|${p.text}`;
    if (filled.has(key)) {
      continue;
    }
    out.push({
      id: `sug-peel-${p.id}`,
      nodeId: p.nodeId,
      text: p.text,
      pageNumber: p.pageNumber,
      confidence: p.kind === 'watermark' ? 'HIGH' : 'MEDIUM',
      reason: `${p.labelVi} — đã bóc khỏi trang (nguồn bản)`,
    });
  }
  return out;
}
