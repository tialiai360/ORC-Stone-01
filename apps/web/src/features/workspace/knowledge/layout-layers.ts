/**
 * Layout Layer Harvest — peel document into reviewable layout planes.
 * Evolutionary: derives from existing StructureRegion / moduleIds (no Foundation rewrite).
 */

import type { KnowledgeNodeId } from '@orc/shared';
import type { PageStructureSnapshot } from '../pdf/viewer-types';
import { MODULE_LABELS_VI, type StructureModuleId } from '../pdf/plugins/types';
import { extractCanCuItems } from './suggest-knowledge-fields';
import { looksLikeMarkdownTable } from './table-grid';

export type LayoutLayerKind =
  | 'header'
  | 'body'
  | 'table'
  | 'legal-basis'
  | 'signature'
  | 'watermark'
  | 'footer'
  | 'annex'
  | 'image'
  | 'other';

/** keep = dùng cho đọc/Knowledge · discard = không dùng (Evidence vẫn còn) · review = cần xem */
export type LayerDisposition = 'keep' | 'discard' | 'review';

export type LayerKnowledgeHint = {
  nodeId: KnowledgeNodeId;
  text: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
};

export type LayoutLayer = {
  id: string;
  kind: LayoutLayerKind;
  labelVi: string;
  pageNumbers: number[];
  textPreview: string;
  fullText: string;
  regionIds: string[];
  moduleIds: StructureModuleId[];
  defaultDisposition: LayerDisposition;
  knowledgeHints: LayerKnowledgeHint[];
};

const KIND_LABEL: Record<LayoutLayerKind, string> = {
  header: 'Phần đầu trang',
  body: 'Nội dung chính',
  table: 'Bảng biểu',
  'legal-basis': 'Căn cứ pháp lý',
  signature: 'Chữ ký / con dấu',
  watermark: 'Phần không cần đọc (watermark)',
  footer: 'Phần cuối trang',
  annex: 'Phụ lục',
  image: 'Hình ảnh',
  other: 'Phần khác',
};

function moduleToKind(moduleId: string | undefined, kind: string | undefined): LayoutLayerKind {
  const mid = moduleId ?? '';
  const k = kind ?? '';
  if (mid === 'watermark' || mid === 'rotated-text' || k === 'watermark') return 'watermark';
  if (
    mid === 'signature' ||
    mid === 'digital-signature' ||
    mid === 'stamp' ||
    k === 'signature' ||
    k === 'stamp'
  ) {
    return 'signature';
  }
  if (
    mid === 'header' ||
    mid === 'repeated-header' ||
    mid === 'logo' ||
    mid === 'page-number' ||
    k === 'header'
  ) {
    return 'header';
  }
  if (mid === 'footer' || mid === 'repeated-footer' || k === 'footer') return 'footer';
  if (mid === 'table' || k === 'table') return 'table';
  if (mid === 'legal-basis' || mid === 'annex' || k === 'annex') {
    return mid === 'legal-basis' ? 'legal-basis' : 'annex';
  }
  if (mid === 'image') return 'image';
  if (
    mid === 'article' ||
    mid === 'clause' ||
    mid === 'point' ||
    mid === 'subject' ||
    k === 'body' ||
    !mid
  ) {
    if (k === 'watermark') return 'watermark';
    if (k === 'table') return 'table';
    if (k === 'signature' || k === 'stamp') return 'signature';
    if (k === 'header') return 'header';
    if (k === 'footer') return 'footer';
    return 'body';
  }
  return 'other';
}

function defaultDisposition(
  kind: LayoutLayerKind,
  hintCount: number,
): LayerDisposition {
  switch (kind) {
    case 'body':
    case 'table':
    case 'legal-basis':
    case 'annex':
      return 'keep';
    case 'watermark':
    case 'signature':
    case 'footer':
    case 'image':
      return 'discard';
    case 'header':
      // Đầu trang: giữ nếu có số VB / trích yếu; không thì bỏ khỏi đọc
      return hintCount > 0 ? 'keep' : 'discard';
    case 'other':
      return hintCount > 0 ? 'keep' : 'discard';
    default:
      return 'keep';
  }
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Normalize for overlap / duplicate detection across layers. */
function textFingerprint(s: string): string {
  return clean(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
}

/** True if `candidate` is largely already covered by an owned fingerprint. */
function isMostlyCoveredBy(candidate: string, owned: Set<string>): boolean {
  const fp = textFingerprint(candidate);
  if (fp.length < 8) {
    return owned.has(fp);
  }
  if (owned.has(fp)) {
    return true;
  }
  for (const o of owned) {
    if (o.length < 8) continue;
    // Candidate is a fragment of owned text → duplicate
    if (o.includes(fp)) {
      return true;
    }
    // Owned sits inside candidate with almost nothing left → treat as duplicate
    if (fp.includes(o)) {
      const leftover = fp.length - o.length;
      if (leftover < 16) {
        return true;
      }
      continue;
    }
    // Most of *candidate* tokens already owned (not symmetric min-size)
    const a = new Set(fp.split(' ').filter((t) => t.length >= 3));
    const b = new Set(o.split(' ').filter((t) => t.length >= 3));
    if (a.size === 0 || b.size === 0) continue;
    let hit = 0;
    for (const t of a) {
      if (b.has(t)) hit += 1;
    }
    if (hit / a.size >= 0.85 && hit >= 3) {
      return true;
    }
  }
  return false;
}

/** Drop lines / paragraphs already claimed; keep exclusive remainder. */
function subtractOwnedText(candidate: string, owned: Set<string>): string {
  const raw = candidate.trim();
  if (!raw) return '';
  if (owned.size === 0) return raw;
  if (isMostlyCoveredBy(raw, owned)) {
    // Still try line peel — mixed regions keep unique lines
  }

  const keptLines: string[] = [];
  for (const line of raw.split(/\n/)) {
    const t = line.trim();
    if (!t) continue;
    if (isMostlyCoveredBy(t, owned)) continue;
    keptLines.push(line.replace(/\s+$/, ''));
  }
  let out = keptLines.join('\n').trim();
  if (!out) return '';

  // Paragraph peel when newline-less blob still embeds owned fingerprints
  if (isMostlyCoveredBy(out, owned) || [...owned].some((o) => o.length >= 20 && textFingerprint(out).includes(o))) {
    const paras = out.split(/\n\n+/);
    if (paras.length > 1) {
      out = paras
        .map((p) => p.trim())
        .filter((p) => p && !isMostlyCoveredBy(p, owned))
        .join('\n\n')
        .trim();
    }
  }
  return out;
}

function claimFingerprints(text: string, owned: Set<string>): void {
  const fp = textFingerprint(text);
  if (fp.length >= 8) owned.add(fp);
  for (const line of text.split(/\n+/)) {
    const lfp = textFingerprint(line);
    if (lfp.length >= 8) owned.add(lfp);
  }
}

/**
 * Claim priority: chrome first, then structured, body last.
 * Prevents the same paragraph living in watermark + body + header.
 */
const KIND_CLAIM_PRIORITY: LayoutLayerKind[] = [
  'watermark',
  'signature',
  'header',
  'footer',
  'image',
  'table',
  'legal-basis',
  'annex',
  'other',
  'body',
];

function hintsForLayer(kind: LayoutLayerKind, text: string): LayerKnowledgeHint[] {
  const t = text.trim();
  if (!t || t.length < 4) return [];
  const out: LayerKnowledgeHint[] = [];

  if (kind === 'legal-basis' || /^Căn\s*cứ/imu.test(t) || t.includes('Căn cứ')) {
    const items = extractCanCuItems(t);
    for (const item of items.slice(0, 8)) {
      out.push({
        nodeId: 'can-cu',
        text: item,
        confidence: 'HIGH',
        reason: 'Từ căn cứ trên văn bản',
      });
    }
  }

  if (kind === 'table' || looksLikeMarkdownTable(t)) {
    out.push({
      nodeId: 'bieu-mau',
      text: t.slice(0, 4000),
      confidence: looksLikeMarkdownTable(t) ? 'HIGH' : 'MEDIUM',
      reason: 'Từ bảng trên văn bản',
    });
  }

  if (kind === 'body' || kind === 'header') {
    const trich =
      /Về việc\s*[:：]?\s*(.+?)(?:\n|$)/i.exec(t)?.[1] ??
      /Trích yếu\s*[:：]\s*(.+)$/im.exec(t)?.[1];
    if (trich && clean(trich).length >= 8) {
      out.push({
        nodeId: 'trich-yeu',
        text: clean(trich).slice(0, 500),
        confidence: 'HIGH',
        reason: 'Từ phần đầu / nội dung',
      });
    }
    const so = /(?:^|\n)\s*Số\s*[:：]?\s*([0-9]{2,}\/[A-Za-zÀ-ỹ0-9.\-]+)/i.exec(t)?.[1];
    if (so) {
      out.push({
        nodeId: 'so-van-ban',
        text: so,
        confidence: 'HIGH',
        reason: 'Từ phần đầu / nội dung',
      });
    }
  }

  if (kind === 'signature') {
    const ky =
      /(?:KT\.|TM\.|TL\.)\s*([A-ZÀ-Ỹ][^\n]{5,60})/m.exec(t)?.[1] ??
      /(?:Người ký|Giám đốc|Phó giám đốc)\s*[:：]?\s*([^\n]{5,60})/im.exec(t)?.[1];
    if (ky && clean(ky).length >= 5) {
      out.push({
        nodeId: 'nguoi-ky',
        text: clean(ky).slice(0, 120),
        confidence: 'MEDIUM',
        reason: 'Từ vùng chữ ký',
      });
    }
  }

  // Watermark: không gợi ý Knowledge mặc định (đã bỏ khỏi đọc) — provenance chỉ khi user "Dùng lại"

  if (kind === 'body' && t.length >= 40 && out.every((h) => h.nodeId !== 'noi-dung')) {
    const lines = t.split(/\n+/).map(clean).filter((l) => l.length >= 20).slice(0, 3);
    if (lines.length >= 2) {
      out.push({
        nodeId: 'noi-dung',
        text: lines.join('\n').slice(0, 500),
        confidence: 'LOW',
        reason: 'Đoạn mở đầu — cần xác nhận',
      });
    }
  }

  return out;
}

type Bucket = {
  kind: LayoutLayerKind;
  regionIds: string[];
  moduleIds: Set<StructureModuleId>;
  pageNumbers: Set<number>;
  texts: string[];
};

/**
 * Derive layout layers from page structure snapshots (regions already detected).
 * Each region / text snippet is claimed by at most one layer (no content overlap).
 */
export function deriveLayoutLayers(
  snapshots: PageStructureSnapshot[],
): LayoutLayer[] {
  const buckets = new Map<LayoutLayerKind, Bucket>();

  const ensure = (kind: LayoutLayerKind): Bucket => {
    let b = buckets.get(kind);
    if (!b) {
      b = {
        kind,
        regionIds: [],
        moduleIds: new Set(),
        pageNumbers: new Set(),
        texts: [],
      };
      buckets.set(kind, b);
    }
    return b;
  };

  type Pending = {
    kind: LayoutLayerKind;
    regionId: string | null;
    moduleId: StructureModuleId | null;
    pageNumber: number;
    text: string;
  };

  const pending: Pending[] = [];

  for (const snap of snapshots) {
    const regions = snap.regions ?? [];
    if (regions.length === 0) {
      if (snap.headerText?.trim()) {
        pending.push({
          kind: 'header',
          regionId: null,
          moduleId: 'header',
          pageNumber: snap.pageNumber,
          text: snap.headerText.trim(),
        });
      }
      if (snap.footerText?.trim()) {
        pending.push({
          kind: 'footer',
          regionId: null,
          moduleId: 'footer',
          pageNumber: snap.pageNumber,
          text: snap.footerText.trim(),
        });
      }
      continue;
    }

    const seenRegionText = new Set<string>();
    for (const r of regions) {
      const kind = moduleToKind(r.moduleId, r.kind);
      const tx = (r.text ?? '').trim();
      const key = `${r.id}|${textFingerprint(tx).slice(0, 80)}`;
      if (seenRegionText.has(key)) {
        continue;
      }
      seenRegionText.add(key);
      pending.push({
        kind,
        regionId: r.id,
        moduleId: (r.moduleId as StructureModuleId) ?? null,
        pageNumber: snap.pageNumber,
        text: tx,
      });
    }

    // headerText/footerText only if not already represented by a region
    if (snap.headerText?.trim()) {
      const ht = snap.headerText.trim();
      const already = pending.some(
        (p) =>
          p.pageNumber === snap.pageNumber &&
          (p.kind === 'header' || isMostlyCoveredBy(ht, new Set([textFingerprint(p.text)]))),
      );
      if (!already) {
        pending.push({
          kind: 'header',
          regionId: null,
          moduleId: 'header',
          pageNumber: snap.pageNumber,
          text: ht,
        });
      }
    }
    if (snap.footerText?.trim()) {
      const ft = snap.footerText.trim();
      const already = pending.some(
        (p) =>
          p.pageNumber === snap.pageNumber &&
          (p.kind === 'footer' || isMostlyCoveredBy(ft, new Set([textFingerprint(p.text)]))),
      );
      if (!already) {
        pending.push({
          kind: 'footer',
          regionId: null,
          moduleId: 'footer',
          pageNumber: snap.pageNumber,
          text: ft,
        });
      }
    }
  }

  // Exclusive claim by priority — later kinds keep only text not already owned.
  const ownedFingerprints = new Set<string>();
  const claimedRegionIds = new Set<string>();

  for (const kind of KIND_CLAIM_PRIORITY) {
    for (const p of pending) {
      if (p.kind !== kind) continue;
      if (p.regionId && claimedRegionIds.has(p.regionId)) continue;

      const exclusive = p.text ? subtractOwnedText(p.text, ownedFingerprints) : '';

      const b = ensure(kind);
      if (p.regionId) {
        claimedRegionIds.add(p.regionId);
        b.regionIds.push(p.regionId);
      }
      b.pageNumbers.add(p.pageNumber);
      if (p.moduleId) b.moduleIds.add(p.moduleId);

      if (!exclusive) {
        // Geometry only — text already claimed by a higher-priority layer
        continue;
      }

      const fp = textFingerprint(exclusive);
      const dup = b.texts.some(
        (t) =>
          textFingerprint(t) === fp ||
          isMostlyCoveredBy(exclusive, new Set([textFingerprint(t)])),
      );
      if (!dup) {
        b.texts.push(exclusive);
      }
      claimFingerprints(exclusive, ownedFingerprints);
    }
  }

  // Stable display order
  const order: LayoutLayerKind[] = [
    'header',
    'watermark',
    'body',
    'legal-basis',
    'table',
    'annex',
    'image',
    'signature',
    'footer',
    'other',
  ];

  const layers: LayoutLayer[] = [];
  for (const kind of order) {
    const b = buckets.get(kind);
    if (!b || (b.texts.length === 0 && b.regionIds.length === 0)) continue;
    const fullText = b.texts.join('\n\n').trim();
    const pages = [...b.pageNumbers].sort((a, c) => a - c);
    const moduleIds = [...b.moduleIds];
    const knowledgeHints = hintsForLayer(kind, fullText);
    layers.push({
      id: `layer-${kind}`,
      kind,
      labelVi: KIND_LABEL[kind],
      pageNumbers: pages,
      textPreview: clean(fullText).slice(0, 160),
      fullText,
      regionIds: b.regionIds,
      moduleIds,
      defaultDisposition: defaultDisposition(kind, knowledgeHints.length),
      knowledgeHints,
    });
  }

  return layers;
}

/** Union bbox of a layout layer's regions (PDF units) for Evidence fit. */
export function boundsForLayoutLayer(
  layer: LayoutLayer,
  snapshots: PageStructureSnapshot[],
): {
  pageNumber: number;
  x: number;
  y: number;
  w: number;
  h: number;
  pageWidth: number;
  pageHeight: number;
} | null {
  const idSet = new Set(layer.regionIds);
  const pages = layer.pageNumbers.length > 0 ? layer.pageNumbers : snapshots.map((s) => s.pageNumber);
  for (const pageNumber of pages) {
    const snap = snapshots.find((s) => s.pageNumber === pageNumber);
    if (!snap) continue;
    const regions = (snap.regions ?? []).filter((r) => idSet.has(r.id));
    if (regions.length === 0) continue;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const r of regions) {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.w);
      maxY = Math.max(maxY, r.y + r.h);
    }
    if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) continue;
    return {
      pageNumber,
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
      pageWidth: snap.pageWidth || 1,
      pageHeight: snap.pageHeight || 1,
    };
  }
  return null;
}

/** Modules that should be hidden when layer disposition is discard. */
export function modulesHiddenByDispositions(
  layers: LayoutLayer[],
  dispositions: Record<string, LayerDisposition>,
): StructureModuleId[] {
  const hidden: StructureModuleId[] = [];
  for (const layer of layers) {
    const d = dispositions[layer.id] ?? layer.defaultDisposition;
    if (d !== 'discard') continue;
    for (const m of layer.moduleIds) {
      hidden.push(m);
    }
    // Ensure chrome kinds hide even if moduleIds empty
    if (layer.kind === 'watermark') hidden.push('watermark', 'rotated-text');
    if (layer.kind === 'signature') {
      hidden.push('signature', 'digital-signature', 'stamp');
    }
    if (layer.kind === 'header') {
      hidden.push('header', 'repeated-header', 'logo', 'page-number');
    }
    if (layer.kind === 'footer') {
      hidden.push('footer', 'repeated-footer');
    }
    if (layer.kind === 'body') {
      hidden.push('article', 'clause', 'point', 'subject', 'selectable-text-layer');
    }
    if (layer.kind === 'table') hidden.push('table');
    if (layer.kind === 'legal-basis') hidden.push('legal-basis');
    if (layer.kind === 'annex') hidden.push('annex');
    if (layer.kind === 'image') hidden.push('image');
  }
  return [...new Set(hidden)];
}

export function layerDispositionLabel(d: LayerDisposition): string {
  switch (d) {
    case 'keep':
      return 'Dùng để đọc';
    case 'discard':
      return 'Bỏ khỏi đọc';
    case 'review':
      return 'Dùng để đọc';
    default:
      return d;
  }
}

/** Seed missing dispositions from layer defaults (idempotent). */
export function seedLayerDispositions(
  layers: LayoutLayer[],
  prev: Record<string, LayerDisposition>,
): Record<string, LayerDisposition> {
  let changed = false;
  const next = { ...prev };
  for (const layer of layers) {
    if (next[layer.id] === undefined) {
      next[layer.id] = layer.defaultDisposition;
      changed = true;
    }
  }
  return changed ? next : prev;
}

export function dispositionStorageKey(documentId: string): string {
  return `orc.layout.dispositions.v1.${documentId}`;
}

export function loadLayerDispositions(documentId: string): Record<string, LayerDisposition> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(dispositionStorageKey(documentId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Record<string, LayerDisposition> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === 'keep' || v === 'discard' || v === 'review') {
        out[k] = v === 'review' ? 'keep' : v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveLayerDispositions(
  documentId: string,
  dispositions: Record<string, LayerDisposition>,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      dispositionStorageKey(documentId),
      JSON.stringify(dispositions),
    );
  } catch {
    // ignore quota
  }
}

export function layerKindModuleLabel(moduleId: StructureModuleId): string {
  return MODULE_LABELS_VI[moduleId] ?? moduleId;
}

/** Collect knowledge hints only from layers marked keep (or review with hints). */
export function hintsFromKeptLayers(
  layers: LayoutLayer[],
  dispositions: Record<string, LayerDisposition>,
): Array<LayerKnowledgeHint & { layerId: string; pageNumber: number }> {
  const out: Array<LayerKnowledgeHint & { layerId: string; pageNumber: number }> = [];
  for (const layer of layers) {
    const d = dispositions[layer.id] ?? layer.defaultDisposition;
    if (d === 'discard') continue;
    const page = layer.pageNumbers[0] ?? 1;
    for (const h of layer.knowledgeHints) {
      out.push({ ...h, layerId: layer.id, pageNumber: page });
    }
  }
  return out;
}
