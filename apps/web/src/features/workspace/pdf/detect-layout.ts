import { boundsOf, median } from './geometry';
import type { LayoutKind, StructureRegion, TextLine } from './types';

export function detectLayoutKind(
  lines: TextLine[],
  pageWidth: number,
  regions: StructureRegion[],
): LayoutKind {
  if (regions.some((r) => r.kind === 'table')) {
    return regions.some((r) => r.label.includes('nested')) ? 'nested-table' : 'table';
  }
  if (regions.some((r) => r.kind === 'signature')) {
    // may still be single-column body
  }
  const bodyLines = lines.filter(
    (l) =>
      !regions.some(
        (r) =>
          r.excludeFromReadingOrder &&
          l.y + l.h / 2 >= r.y &&
          l.y + l.h / 2 <= r.y + r.h,
      ),
  );
  if (bodyLines.length < 4 || pageWidth <= 0) {
    return 'single-column';
  }
  const mid = pageWidth * 0.45;
  const left = bodyLines.filter((l) => l.x + l.w / 2 < mid);
  const right = bodyLines.filter((l) => l.x + l.w / 2 >= mid);
  if (left.length >= 2 && right.length >= 2) {
    const leftMax = Math.max(...left.map((l) => l.x + l.w));
    const rightMin = Math.min(...right.map((l) => l.x));
    if (rightMin - leftMax > pageWidth * 0.04) {
      return 'multi-column';
    }
  }
  // Sidebar: narrow column on edge
  const leftEdge = bodyLines.filter((l) => l.x + l.w < pageWidth * 0.28);
  const main = bodyLines.filter((l) => l.x > pageWidth * 0.3);
  if (leftEdge.length >= 3 && main.length >= 3) {
    return 'sidebar';
  }
  return 'single-column';
}

/** Heuristic table zones: aligned multi-column short lines. */
export function detectTableRegions(
  lines: TextLine[],
  pageWidth: number,
  pageHeight: number,
  excludedItemIds: Set<string>,
): StructureRegion[] {
  const candidates = lines.filter(
    (l) =>
      !l.items.every((i) => excludedItemIds.has(i.id)) &&
      l.y > pageHeight * 0.12 &&
      l.y < pageHeight * 0.88,
  );
  if (candidates.length < 3) {
    return [];
  }

  // Score lines by number of large internal gaps (cell separators)
  const scored = candidates.map((l) => {
    const items = [...l.items].sort((a, b) => a.x - b.x);
    let gaps = 0;
    const medH = median(items.map((i) => i.h)) || 12;
    for (let i = 1; i < items.length; i++) {
      const gap = items[i]!.x - (items[i - 1]!.x + items[i - 1]!.w);
      if (gap > medH * 1.8) {
        gaps++;
      }
    }
    return { line: l, gaps };
  });

  const tableLines = scored.filter((s) => s.gaps >= 2).map((s) => s.line);
  if (tableLines.length < 2) {
    return [];
  }

  // Cluster vertically contiguous table lines
  tableLines.sort((a, b) => a.y - b.y);
  const clusters: TextLine[][] = [];
  let bucket: TextLine[] = [];
  const medH = median(tableLines.map((l) => l.h)) || 12;
  for (const line of tableLines) {
    if (bucket.length === 0) {
      bucket = [line];
      continue;
    }
    const prev = bucket[bucket.length - 1]!;
    if (line.y - (prev.y + prev.h) <= medH * 2.2) {
      bucket.push(line);
    } else {
      if (bucket.length >= 2) {
        clusters.push(bucket);
      }
      bucket = [line];
    }
  }
  if (bucket.length >= 2) {
    clusters.push(bucket);
  }

  return clusters.map((cluster, idx) => {
    const b = boundsOf(cluster);
    // Expand slightly for selection
    return {
      id: `region-table-${idx}`,
      kind: 'table' as const,
      label: cluster.length > 8 ? 'Table (nested?)' : 'Table',
      text: cluster.map((l) => l.text).join('\n'),
      itemIds: cluster.flatMap((l) => l.items.map((i) => i.id)),
      excludeFromReadingOrder: false,
      selectable: true,
      x: Math.max(0, b.x - 2),
      y: Math.max(0, b.y - 2),
      w: Math.min(pageWidth - b.x, b.w + 4),
      h: b.h + 4,
    };
  });
}

/** Split table region lines into cell-like selection blocks (order preserved). */
export function tableCellBlocks(
  region: StructureRegion,
  lines: TextLine[],
): { text: string; x: number; y: number; w: number; h: number; lineId: string }[] {
  const regionLines = lines.filter((l) =>
    l.items.some((i) => region.itemIds.includes(i.id)),
  );
  const cells: {
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    lineId: string;
  }[] = [];
  for (const line of regionLines) {
    const items = [...line.items].sort((a, b) => a.x - b.x);
    const medH = median(items.map((i) => i.h)) || 12;
    let cellItems = [items[0]!];
    const flush = () => {
      if (cellItems.length === 0) {
        return;
      }
      const b = boundsOf(cellItems);
      const text = cellItems
        .map((i) => i.text)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) {
        cells.push({ text, ...b, lineId: line.id });
      }
      cellItems = [];
    };
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1]!;
      const cur = items[i]!;
      const gap = cur.x - (prev.x + prev.w);
      if (gap > medH * 1.8) {
        flush();
        cellItems = [cur];
      } else {
        cellItems.push(cur);
      }
    }
    flush();
  }
  return cells;
}
