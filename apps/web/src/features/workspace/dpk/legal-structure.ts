/**
 * Legal / presentation structure helpers — regex heuristics only.
 * No OCR · No AI · No LLM. Aligns to DPK Article/Clause/Point/Subject/LegalBasis.
 */

import { boundsOf } from '../pdf/geometry';
import type { StructureRegion, TextLine } from '../pdf/types';
import type { DetectorContext, DetectorResult, StructureDetectorPlugin } from '../pdf/plugins/types';

export type LegalKind = 'article' | 'clause' | 'point' | 'subject' | 'legal-basis';

/** Avoid JS `\b` after Vietnamese letters (ASCII-word boundary only). */
const PATTERNS: { kind: LegalKind; re: RegExp; label: string }[] = [
  {
    kind: 'subject',
    re: /^(v\/v|về\s*việc)(?:\s|$|[.:])/i,
    label: 'Trích yếu',
  },
  {
    kind: 'legal-basis',
    re: /^căn\s*cứ(?:\s|$|[.:])/i,
    label: 'Căn cứ',
  },
  {
    kind: 'article',
    re: /^điều\s+\d+(?:\s|$|[.:])/i,
    label: 'Điều',
  },
  {
    kind: 'clause',
    re: /^(\d+)[\.\)]\s+\S/,
    label: 'Khoản',
  },
  {
    kind: 'point',
    re: /^([a-z]|[ivxlcdm]+)[\.\)]\s+\S/i,
    label: 'Điểm',
  },
];

export function classifyLegalLine(text: string): LegalKind | null {
  const t = text.trim();
  if (!t) {
    return null;
  }
  for (const p of PATTERNS) {
    if (p.re.test(t)) {
      // Avoid treating "1. Điều ..." double — article wins if both (article checked first among numbered)
      if (p.kind === 'clause' && /^điều\s+\d+/i.test(t)) {
        continue;
      }
      if (p.kind === 'point' && /^\d+[\.\)]/.test(t)) {
        continue;
      }
      return p.kind;
    }
  }
  return null;
}

function regionFor(
  ctx: DetectorContext,
  kind: LegalKind,
  lines: TextLine[],
  label: string,
): StructureRegion {
  const itemIds = lines.flatMap((l) => l.items.map((i) => i.id));
  return {
    id: `region-${kind}-${ctx.pageNumber}-${itemIds[0] ?? 'x'}`,
    kind: 'header-block',
    label,
    text: lines.map((l) => l.text).join(' '),
    itemIds,
    excludeFromReadingOrder: false,
    selectable: true,
    moduleId: kind,
    ...boundsOf(lines),
  };
}

/**
 * Detect legal / presentation units from text lines.
 * Does not claim items (body remains selectable & in Reading Order).
 */
export function detectLegalStructure(ctx: DetectorContext): DetectorResult {
  const regions: StructureRegion[] = [];
  const flags: DetectorResult['flags'] = {};

  for (const line of ctx.lines) {
    if (!line.text.trim()) {
      continue;
    }
    // Prefer article over bare numbered clause when line starts with Điều
    let kind = classifyLegalLine(line.text);
    if (!kind) {
      continue;
    }
    // Soft filter: clauses/points only in mid-page body (reduce header noise)
    if ((kind === 'clause' || kind === 'point') && (line.y < ctx.pageHeight * 0.12 || line.y > ctx.pageHeight * 0.92)) {
      continue;
    }
    const meta = PATTERNS.find((p) => p.kind === kind)!;
    regions.push(regionFor(ctx, kind, [line], meta.label));
    flags[kind] = true;
  }

  return {
    moduleId: regions[0]?.moduleId === 'subject' ? 'subject' : 'article',
    regions,
    flags,
  };
}

export function createLegalStructurePlugin(): StructureDetectorPlugin {
  return {
    id: 'LegalStructureDetector',
    moduleId: 'article',
    labelVi: 'Cấu trúc pháp lý',
    priority: 45,
    detect: detectLegalStructure,
  };
}

/** Outline entries for left nav (from regions across pages). */
export type OutlineEntry = {
  id: string;
  kind: LegalKind | 'page';
  label: string;
  pageNumber: number;
  text: string;
};

export function buildLegalOutline(
  pages: Array<{ pageNumber: number; regions: StructureRegion[] }>,
): OutlineEntry[] {
  const out: OutlineEntry[] = [];
  for (const page of pages) {
    for (const r of page.regions) {
      const mid = r.moduleId;
      if (
        mid === 'article' ||
        mid === 'clause' ||
        mid === 'point' ||
        mid === 'subject' ||
        mid === 'legal-basis'
      ) {
        out.push({
          id: r.id,
          kind: mid,
          label: r.label,
          pageNumber: page.pageNumber,
          text: r.text.slice(0, 80),
        });
      }
    }
  }
  return out.sort((a, b) => a.pageNumber - b.pageNumber || a.text.localeCompare(b.text, 'vi'));
}
