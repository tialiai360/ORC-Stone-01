/**
 * Region-first reading order: Region → columns → paragraphs.
 */

import { boundsOf, median } from '../geometry';
import type { SelectionBlock, StructureRegion, TextLine, TextParagraph } from '../types';
import type { DocumentRegion, DocumentRegionGraph } from './types';

function linesForRegion(lines: TextLine[], region: DocumentRegion): TextLine[] {
  const ids = new Set(region.itemIds);
  return lines.filter(
    (l) => l.text.trim() && l.items.some((i) => ids.has(i.id)),
  );
}

function detectColumns(lines: TextLine[], pageWidth: number): TextLine[][] {
  if (lines.length < 4 || pageWidth <= 0) {
    return [lines.sort((a, b) => a.y - b.y || a.x - b.x)];
  }
  const mid = pageWidth * 0.45;
  const left = lines.filter((l) => l.x + l.w / 2 < mid);
  const right = lines.filter((l) => l.x + l.w / 2 >= mid);
  if (left.length >= 2 && right.length >= 2) {
    const leftMax = Math.max(...left.map((l) => l.x + l.w));
    const rightMin = Math.min(...right.map((l) => l.x));
    if (rightMin - leftMax > pageWidth * 0.04) {
      return [left.sort((a, b) => a.y - b.y), right.sort((a, b) => a.y - b.y)];
    }
  }
  return [lines.sort((a, b) => a.y - b.y || a.x - b.x)];
}

function paragraphsFromLines(
  lines: TextLine[],
  pageWidth: number,
  regionId: string,
  startIdx: number,
): { paragraphs: TextParagraph[]; nextIdx: number } {
  const columns = detectColumns(lines, pageWidth);
  const paragraphs: TextParagraph[] = [];
  let pIdx = startIdx;

  for (const col of columns) {
    if (col.length === 0) {
      continue;
    }
    const medH = median(col.map((l) => l.h)) || 12;
    let bucket: TextLine[] = [];
    const flush = () => {
      if (bucket.length === 0) {
        return;
      }
      const b = boundsOf(bucket);
      const text = bucket
        .map((l) => l.text)
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) {
        paragraphs.push({
          id: `para-${regionId}-${pIdx++}`,
          text,
          lines: bucket,
          role: 'body',
          ...b,
        });
      }
      bucket = [];
    };
    for (const line of col) {
      if (bucket.length === 0) {
        bucket = [line];
        continue;
      }
      const prev = bucket[bucket.length - 1]!;
      const gap = line.y - (prev.y + prev.h);
      const indentDelta = Math.abs(line.x - prev.x);
      if (gap > medH * 0.85 || indentDelta > pageWidth * 0.08) {
        flush();
        bucket = [line];
      } else {
        bucket.push(line);
      }
    }
    flush();
  }

  return { paragraphs, nextIdx: pIdx };
}

/** Build document reading-order paragraphs region-by-region. */
export function buildRegionFirstReadingOrder(
  graph: DocumentRegionGraph,
  lines: TextLine[],
): TextParagraph[] {
  const byId = new Map(graph.regions.map((r) => [r.id, r]));
  const out: TextParagraph[] = [];
  let idx = 0;

  const order = graph.readingRegionOrder.length
    ? graph.readingRegionOrder
    : graph.regions.filter((r) => r.kind === 'main').map((r) => r.id);

  for (const rid of order) {
    const region = byId.get(rid);
    if (!region || region.excludeFromDocumentReadingOrder) {
      continue;
    }
    // Skip chrome objects' exclusive items when watermark etc.
    const regionLines = linesForRegion(lines, region).filter((l) => {
      const midY = l.y + l.h / 2;
      const midX = l.x + l.w / 2;
      const hitWm = region.objects.some(
        (o) =>
          o.type === 'watermark' &&
          midX >= o.x &&
          midX <= o.x + o.w &&
          midY >= o.y &&
          midY <= o.y + o.h,
      );
      return !hitWm;
    });
    const built = paragraphsFromLines(regionLines, graph.pageWidth, region.id, idx);
    idx = built.nextIdx;
    out.push(...built.paragraphs);
  }

  return out;
}

export function buildRegionSelectionBlocks(
  paragraphs: TextParagraph[],
  graph: DocumentRegionGraph,
): SelectionBlock[] {
  const main = graph.regions.find((r) => r.kind === 'main');
  return paragraphs.map((p, i) => ({
    id: `sel-${p.id}`,
    text: p.text,
    paragraphId: p.id,
    role: p.role,
    regionId: main?.id,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    // keep index stable
    ...(i >= 0 ? {} : {}),
  }));
}

/** Map DocumentRegion graph → legacy StructureRegion list for module UI. */
export function documentRegionsToStructureRegions(
  graph: DocumentRegionGraph,
): StructureRegion[] {
  const out: StructureRegion[] = [];
  for (const r of graph.regions) {
    if (r.kind === 'header' || r.kind === 'footer') {
      const text = r.objects.map((o) => o.text).filter(Boolean).join(' ');
      out.push({
        id: r.id,
        kind: r.kind,
        label: r.labelVi,
        text,
        itemIds: r.itemIds,
        excludeFromReadingOrder: r.excludeFromDocumentReadingOrder,
        selectable: r.selectable,
        moduleId: r.kind,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
      });
    }
    for (const o of r.objects) {
      out.push({
        id: o.id,
        kind:
          o.type === 'table'
            ? 'table'
            : o.type === 'watermark'
              ? 'watermark'
              : o.type === 'signature' || o.type === 'digital-signature'
                ? 'signature'
                : o.type === 'seal'
                  ? 'stamp'
                  : 'header-block',
        label: o.type,
        text: o.text ?? '',
        itemIds: o.itemIds,
        excludeFromReadingOrder:
          o.layer === 'security' || o.layer === 'chrome' || o.type === 'watermark',
        selectable: o.type !== 'watermark',
        moduleId: o.moduleId ?? o.type,
        x: o.x,
        y: o.y,
        w: o.w,
        h: o.h,
      });
    }
  }
  return out;
}
