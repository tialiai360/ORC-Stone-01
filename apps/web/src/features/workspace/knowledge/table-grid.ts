/**
 * Table grid helpers — markdown serialize/parse for Knowledge «Biểu mẫu».
 * Reuses detect-layout cell gaps; no OCR/AI.
 */

import { tableCellBlocks } from '../pdf/detect-layout';
import type { StructureRegion, TextLine } from '../pdf/types';

export type TableGrid = {
  id: string;
  rows: string[][];
  rowCount: number;
  colCount: number;
  markdown: string;
};

function escCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

/** Build row×col grid from table region + page lines. */
export function buildTableGrid(
  region: StructureRegion,
  lines: TextLine[],
): TableGrid | null {
  const cells = tableCellBlocks(region, lines);
  if (cells.length === 0) {
    const fallback = region.text.replace(/\s+/g, ' ').trim();
    if (!fallback) {
      return null;
    }
    return {
      id: region.id,
      rows: [[fallback]],
      rowCount: 1,
      colCount: 1,
      markdown: `| ${escCell(fallback)} |\n| --- |`,
    };
  }

  const rowOrder: string[] = [];
  const byRow = new Map<string, string[]>();
  for (const c of cells) {
    if (!byRow.has(c.lineId)) {
      rowOrder.push(c.lineId);
      byRow.set(c.lineId, []);
    }
    byRow.get(c.lineId)!.push(c.text);
  }

  const rows = rowOrder.map((id) => byRow.get(id) ?? []);
  const colCount = Math.max(1, ...rows.map((r) => r.length));
  const normalized = rows.map((r) => {
    const next = [...r];
    while (next.length < colCount) {
      next.push('');
    }
    return next;
  });

  const header = normalized[0] ?? Array.from({ length: colCount }, () => '');
  const sep = header.map(() => '---');
  const body = normalized.slice(1);
  const markdown = [
    `| ${header.map(escCell).join(' | ')} |`,
    `| ${sep.join(' | ')} |`,
    ...body.map((r) => `| ${r.map(escCell).join(' | ')} |`),
  ].join('\n');

  return {
    id: region.id,
    rows: normalized,
    rowCount: normalized.length,
    colCount,
    markdown,
  };
}

/** Enrich table region `.text` with markdown grid (keeps selectable corpus useful). */
export function enrichTableRegionMarkdown(
  region: StructureRegion,
  lines: TextLine[],
): StructureRegion {
  if (region.kind !== 'table') {
    return region;
  }
  const grid = buildTableGrid(region, lines);
  if (!grid) {
    return region;
  }
  return { ...region, text: grid.markdown, label: `Bảng ${grid.rowCount}×${grid.colCount}` };
}

/** Parse markdown pipe table → rows (no header separator row). */
export function parseMarkdownTable(text: string): string[][] | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));
  if (lines.length < 2) {
    return null;
  }
  const rows: string[][] = [];
  for (const line of lines) {
    const inner = line.slice(1, -1);
    const cells = inner.split('|').map((c) => c.trim());
    // Skip alignment row | --- | --- |
    if (cells.every((c) => /^:?-{3,}:?$/.test(c))) {
      continue;
    }
    rows.push(cells);
  }
  return rows.length >= 1 ? rows : null;
}

export function looksLikeMarkdownTable(text: string): boolean {
  return parseMarkdownTable(text) !== null;
}
