/**
 * Attach document objects into regions using existing structure module detectors.
 */

import { getDefaultPluginManager } from '../plugins/registry';
import type { StructureRegion } from '../types';
import type { TextItemGeom, TextLine } from '../types';
import type { DocumentObject, DocumentObjectType, DocumentRegion } from './types';

function objectTypeFromModule(moduleId?: string): DocumentObjectType {
  switch (moduleId) {
    case 'table':
      return 'table';
    case 'watermark':
      return 'watermark';
    case 'signature':
      return 'signature';
    case 'digital-signature':
      return 'digital-signature';
    case 'stamp':
      return 'seal';
    case 'logo':
      return 'logo';
    case 'qr-code':
      return 'qr-code';
    case 'barcode':
      return 'barcode';
    case 'page-number':
      return 'page-number';
    case 'image':
      return 'image';
    case 'article':
    case 'clause':
    case 'point':
    case 'legal-basis':
      return 'legal-unit';
    case 'subject':
      return 'subject';
    default:
      return 'text';
  }
}

function layerFor(type: DocumentObjectType): DocumentObject['layer'] {
  if (type === 'watermark') {
    return 'security';
  }
  if (type === 'logo' || type === 'page-number') {
    return 'chrome';
  }
  if (type === 'image' || type === 'chart' || type === 'qr-code' || type === 'barcode') {
    return 'media';
  }
  return 'content';
}

function ownerRegion(regions: DocumentRegion[], sr: StructureRegion): DocumentRegion | undefined {
  const ids = new Set(sr.itemIds);
  let best: DocumentRegion | undefined;
  let bestScore = 0;
  for (const r of regions) {
    const score = r.itemIds.filter((id) => ids.has(id)).length;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  if (best && bestScore > 0) {
    return best;
  }
  // Fallback: center point
  const cx = sr.x + sr.w / 2;
  const cy = sr.y + sr.h / 2;
  return regions.find(
    (r) => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h,
  );
}

/** Run legacy structure plugins and nest results as DocumentObjects. */
export function attachObjectsFromStructurePlugins(
  regions: DocumentRegion[],
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
  items: TextItemGeom[],
  lines: TextLine[],
): { regions: DocumentRegion[]; structureRegions: StructureRegion[]; flags: Record<string, boolean> } {
  const mgr = getDefaultPluginManager();
  const { regions: structureRegions, flags } = mgr.run({
    pageNumber,
    pageWidth,
    pageHeight,
    items,
    lines,
    claimedItemIds: new Set(),
  });

  const next = regions.map((r) => ({ ...r, objects: [...r.objects] }));
  let objIdx = 0;

  for (const sr of structureRegions) {
    const owner = ownerRegion(next, sr) ?? next.find((r) => r.kind === 'main') ?? next[0];
    if (!owner) {
      continue;
    }
    const type = objectTypeFromModule(sr.moduleId);
    const obj: DocumentObject = {
      id: `obj-${pageNumber}-${objIdx++}`,
      type,
      text: sr.text,
      itemIds: sr.itemIds,
      confidence: 'MEDIUM',
      moduleId: sr.moduleId,
      regionId: owner.id,
      layer: layerFor(type),
      x: sr.x,
      y: sr.y,
      w: sr.w,
      h: sr.h,
    };
    const target = next.find((r) => r.id === owner.id);
    target?.objects.push(obj);
  }

  const flagMap: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(flags)) {
    if (v) {
      flagMap[k] = true;
    }
  }

  return { regions: next, structureRegions, flags: flagMap };
}
