/**
 * Normalize browser Selection using Structure Pipeline selection blocks.
 */

import type { AssignmentStructureRef } from '@orc/shared';
import { bridgeForStoneModule } from '../dpk/module-map';
import type { PageStructureModel, SelectionBlock } from './types';

function normalizeWs(s: string): string {
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function rangeIntersectsElement(range: Range, el: HTMLElement): boolean {
  try {
    const er = document.createRange();
    er.selectNodeContents(el);
    return (
      range.compareBoundaryPoints(Range.END_TO_START, er) < 0 &&
      range.compareBoundaryPoints(Range.START_TO_END, er) > 0
    );
  } catch {
    return false;
  }
}

/** Resolve hit text via Locator (Knowledge-safe: no DOM in this function). */
export function selectionTextFromRegions(
  regions: Array<{ text: string }>,
  fallbackRaw: string,
): string {
  if (regions.length === 0) {
    return cleanFragmentedSelection(fallbackRaw);
  }
  const joined = normalizeWs(regions.map((r) => r.text).join(' '));
  return joined.length > 0 ? joined : cleanFragmentedSelection(fallbackRaw);
}

/** Prefer reconstructed blocks; fall back to cleaned toString(). */
export function selectionTextFromModel(
  selection: Selection,
  model: PageStructureModel | null,
  pageEl: HTMLElement | null,
): string {
  const raw = normalizeWs(selection.toString());
  if (!raw) {
    return '';
  }
  if (!model?.hasUsableText || !pageEl || selection.rangeCount === 0) {
    return cleanFragmentedSelection(raw);
  }

  const range = selection.getRangeAt(0);
  const spans = pageEl.querySelectorAll<HTMLElement>(
    '.react-pdf__Page__textContent span, .textLayer span',
  );
  const hitIds = new Set<string>();
  spans.forEach((el) => {
    if (el.dataset.orcItemId && rangeIntersectsElement(range, el)) {
      hitIds.add(el.dataset.orcItemId);
    }
  });

  if (hitIds.size === 0) {
    return cleanFragmentedSelection(raw);
  }

  // Prefer non-watermark blocks first for annotation text
  const hitBlocks = model.blocks.filter((b) => {
    if (b.role === 'watermark') {
      return false;
    }
    return model.lines.some(
      (line) =>
        line.items.some((it) => hitIds.has(it.id)) &&
        line.y + line.h / 2 >= b.y &&
        line.y + line.h / 2 <= b.y + b.h &&
        line.x + line.w / 2 >= b.x &&
        line.x + line.w / 2 <= b.x + b.w,
    );
  });

  let hitLines = model.lines.filter((line) => line.items.some((it) => hitIds.has(it.id)));
  if (hitLines.length === 0) {
    return cleanFragmentedSelection(raw);
  }

  // EVO-001F: keep selection inside a single DocumentRegion when possible
  const regionId = dominantRegionId(model, hitIds);
  if (regionId && model.regionGraph) {
    const region = model.regionGraph.regions.find((r) => r.id === regionId);
    if (region) {
      const allowed = new Set(region.itemIds);
      const scoped = hitLines.filter((l) => l.items.some((it) => allowed.has(it.id)));
      if (scoped.length > 0) {
        hitLines = scoped;
      }
    }
  }

  const fromLines = normalizeWs(hitLines.map((l) => l.text).join(' '));
  if (hitBlocks.length === 1) {
    return preferCloser(raw, fromLines, hitBlocks);
  }
  if (fromLines.length >= raw.length * 0.5) {
    return preferCloser(raw, fromLines, hitBlocks);
  }
  return cleanFragmentedSelection(raw);
}

function dominantRegionId(
  model: PageStructureModel,
  hitIds: Set<string>,
): string | undefined {
  const graph = model.regionGraph;
  if (!graph) {
    return undefined;
  }
  let bestId: string | undefined;
  let best = 0;
  for (const r of graph.regions) {
    const score = r.itemIds.filter((id) => hitIds.has(id)).length;
    if (score > best) {
      best = score;
      bestId = r.id;
    }
  }
  return bestId;
}

function preferCloser(raw: string, rebuilt: string, blocks: SelectionBlock[]): string {
  if (blocks.length === 1) {
    const blockText = blocks[0]!.text;
    const needle = cleanFragmentedSelection(raw);
    const idx = blockText.toLowerCase().indexOf(needle.toLowerCase());
    if (idx >= 0) {
      return blockText.slice(idx, idx + needle.length);
    }
    if (needle.length >= 8 && blockText.toLowerCase().includes(needle.slice(0, 8).toLowerCase())) {
      return rebuilt.length >= needle.length ? rebuilt : needle;
    }
  }
  return rebuilt.length > 0 ? rebuilt : cleanFragmentedSelection(raw);
}

export function cleanFragmentedSelection(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/([^\s\n])\n([^\s\n])/gu, (_full, a: string, b: string) => {
      if (/\p{L}|\p{N}/u.test(a) && /\p{L}|\p{N}/u.test(b)) {
        return `${a}${b}`;
      }
      return `${a} ${b}`;
    })
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** @deprecated Prefer hasUsableText — name kept for call-site compatibility. */
export function hasUsableTextLayer(model: PageStructureModel | null, spanCount: number): boolean {
  return hasUsableText(model, spanCount);
}

/** True when page model has selectable embedded/derived text primitives. */
export function hasUsableText(model: PageStructureModel | null, spanCount: number): boolean {
  if (!model) {
    return spanCount > 0;
  }
  return model.hasUsableText;
}

/** Resolve dominant DOI object from hit text-item ids (pure, testable). */
export function resolveDoiObjectFromHitIds(
  model: PageStructureModel,
  hitIds: Set<string>,
): { objectId: string; objectClass: string } | undefined {
  if (!model.objectGraph?.objects?.length || hitIds.size === 0) {
    return undefined;
  }
  let best: { id: string; cls: string; score: number } | null = null;
  for (const obj of model.objectGraph.objects) {
    if (obj.class === 'body-text' || obj.class === 'unknown') {
      continue;
    }
    const score = obj.textItemIds.filter((id) => hitIds.has(id)).length;
    if (score <= 0) {
      continue;
    }
    // Prefer higher-signal classes slightly (QR/seal/title over header chrome)
    const classBoost =
      obj.class === 'qr-code' ||
      obj.class === 'seal' ||
      obj.class === 'title' ||
      obj.class === 'heading'
        ? 0.15
        : 0;
    const ranked = score * 10 + obj.confidenceScore + classBoost;
    if (!best || ranked > best.score) {
      best = { id: obj.id, cls: obj.class, score: ranked };
    }
  }
  return best ? { objectId: best.id, objectClass: best.cls } : undefined;
}

/** Best-effort Knowledge Object structure binding for a DOM selection. */
export function structureRefFromSelection(
  selection: Selection,
  model: PageStructureModel | null,
  pageEl: HTMLElement | null,
): AssignmentStructureRef | undefined {
  if (!model?.hasUsableText || !pageEl || selection.rangeCount === 0) {
    return undefined;
  }
  const range = selection.getRangeAt(0);
  const spans = pageEl.querySelectorAll<HTMLElement>(
    '.react-pdf__Page__textContent span, .textLayer span',
  );
  const hitIds = new Set<string>();
  spans.forEach((el) => {
    if (el.dataset.orcItemId && rangeIntersectsElement(range, el)) {
      hitIds.add(el.dataset.orcItemId);
    }
  });
  if (hitIds.size === 0) {
    return undefined;
  }

  const docRegionId = dominantRegionId(model, hitIds);
  const region = model.regions.find((r) => r.itemIds.some((id) => hitIds.has(id)));
  const block = model.blocks.find((b) =>
    model.lines.some(
      (line) =>
        line.items.some((it) => hitIds.has(it.id)) &&
        line.y + line.h / 2 >= b.y &&
        line.y + line.h / 2 <= b.y + b.h,
    ),
  );
  const moduleId = region?.moduleId ?? (block?.role === 'body' ? undefined : block?.role);
  const bridge = bridgeForStoneModule(moduleId);
  const doi = resolveDoiObjectFromHitIds(model, hitIds);

  if (!block && !region && !docRegionId && !doi) {
    return undefined;
  }
  return {
    blockId: block?.id,
    regionId: docRegionId ?? region?.id,
    moduleId,
    dpkClass: bridge?.dpkClass,
    objectId: doi?.objectId,
    objectClass: doi?.objectClass,
  };
}
