import { boundsOf, median } from './geometry';
import type {
  SelectionBlock,
  StructureRegion,
  StructureRole,
  TextItemGeom,
  TextLine,
  TextParagraph,
} from './types';
import { tableCellBlocks } from './detect-layout';

function itemExcluded(id: string, regions: StructureRegion[]): boolean {
  return regions.some((r) => r.excludeFromReadingOrder && r.itemIds.includes(id));
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

function roleForBody(): StructureRole {
  return 'body';
}

/** Build body paragraphs in logical reading order (header/footer/wm excluded). */
export function buildReadingOrderParagraphs(
  lines: TextLine[],
  regions: StructureRegion[],
  pageWidth: number,
): TextParagraph[] {
  const bodyLines = lines.filter(
    (l) => !l.items.every((i) => itemExcluded(i.id, regions)) && l.text.trim(),
  );
  // Drop lines fully inside excluded regions
  const filtered = bodyLines.filter((l) => {
    const cy = l.y + l.h / 2;
    const cx = l.x + l.w / 2;
    return !regions.some(
      (r) =>
        r.excludeFromReadingOrder &&
        cx >= r.x &&
        cx <= r.x + r.w &&
        cy >= r.y &&
        cy <= r.y + r.h &&
        l.items.filter((i) => r.itemIds.includes(i.id)).length >= l.items.length * 0.6,
    );
  });

  const columns = detectColumns(filtered, pageWidth);
  const paragraphs: TextParagraph[] = [];
  let pIdx = 0;

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
          id: `para-${pIdx++}`,
          text,
          lines: bucket,
          role: roleForBody(),
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
      if (gap <= medH * 1.65 && indentDelta <= Math.max(24, pageWidth * 0.08)) {
        bucket.push(line);
      } else {
        flush();
        bucket = [line];
      }
    }
    flush();
  }
  return paragraphs;
}

export function buildSelectionBlocks(
  paragraphs: TextParagraph[],
  regions: StructureRegion[],
  lines: TextLine[],
): SelectionBlock[] {
  const blocks: SelectionBlock[] = [];

  // Body paragraphs
  for (const p of paragraphs) {
    blocks.push({
      id: `block-${p.id}`,
      text: p.text,
      paragraphId: p.id,
      role: p.role,
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
    });
  }

  // Header / footer / signature as their own selectable blocks (not in body corpus)
  for (const r of regions) {
    if (r.kind === 'watermark') {
      // Watermark: selectable but as one block so it doesn't fragment body
      if (r.selectable && r.text.trim()) {
        blocks.push({
          id: `block-${r.id}`,
          text: r.text.replace(/\s+/g, ' ').trim(),
          paragraphId: r.id,
          role: 'watermark',
          regionId: r.id,
          x: r.x,
          y: r.y,
          w: r.w,
          h: r.h,
        });
      }
      continue;
    }
    if (r.kind === 'table') {
      const cells = tableCellBlocks(r, lines);
      cells.forEach((c, i) => {
        blocks.push({
          id: `block-${r.id}-cell-${i}`,
          text: c.text,
          paragraphId: r.id,
          role: 'table-cell',
          regionId: r.id,
          x: c.x,
          y: c.y,
          w: c.w,
          h: c.h,
        });
      });
      // Whole table block too
      blocks.push({
        id: `block-${r.id}-all`,
        text: r.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
        paragraphId: r.id,
        role: 'table',
        regionId: r.id,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
      });
      continue;
    }
    if (r.text.trim()) {
      const role: StructureRole =
        r.kind === 'header'
          ? 'header'
          : r.kind === 'footer'
            ? 'footer'
            : r.kind === 'signature'
              ? 'signature'
              : 'body';
      blocks.push({
        id: `block-${r.id}`,
        text: r.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
        paragraphId: r.id,
        role,
        regionId: r.id,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
      });
    }
  }

  return blocks.filter((b) => b.text.length > 0);
}

export function markOrphans(
  items: TextItemGeom[],
  lines: TextLine[],
  regions: StructureRegion[],
): TextItemGeom[] {
  const inLine = new Set(lines.flatMap((l) => l.items.map((i) => i.id)));
  const inRegion = new Set(regions.flatMap((r) => r.itemIds));
  return items.map((it) => {
    const orphan =
      !it.flags?.invisible &&
      !it.flags?.watermark &&
      !inLine.has(it.id) &&
      !inRegion.has(it.id);
    return orphan ? { ...it, flags: { ...it.flags, orphan: true } } : it;
  });
}
