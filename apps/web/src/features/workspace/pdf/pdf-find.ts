/**
 * In-document text find (presentation). Uses page text corpora from Input Runtime.
 */

export type FindMatch = {
  pageNumber: number;
  /** Start index in normalized page corpus. */
  start: number;
  end: number;
  preview: string;
};

export type FindQuery = {
  query: string;
  caseSensitive: boolean;
};

function normalizeForFind(s: string, caseSensitive: boolean): string {
  const t = s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');
  return caseSensitive ? t : t.toLowerCase();
}

/** Find all matches of query across page corpora (page → text). */
export function findInPageCorpora(
  corpora: Record<number, string>,
  query: FindQuery,
): FindMatch[] {
  const q = normalizeForFind(query.query.trim(), query.caseSensitive);
  if (!q || q.length < 1) {
    return [];
  }
  const pages = Object.keys(corpora)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  const out: FindMatch[] = [];
  for (const pageNumber of pages) {
    const raw = corpora[pageNumber] ?? '';
    const hay = normalizeForFind(raw, query.caseSensitive);
    if (!hay) {
      continue;
    }
    let from = 0;
    while (from < hay.length) {
      const idx = hay.indexOf(q, from);
      if (idx < 0) {
        break;
      }
      const end = idx + q.length;
      const previewStart = Math.max(0, idx - 24);
      const previewEnd = Math.min(raw.length, end + 24);
      out.push({
        pageNumber,
        start: idx,
        end,
        preview: raw.slice(previewStart, previewEnd).replace(/\s+/g, ' ').trim(),
      });
      from = idx + Math.max(1, q.length);
      if (out.length >= 500) {
        return out;
      }
    }
  }
  return out;
}

/** Locate match boxes on a page by probing TextLayer spans (CSS % of page). */
export function findMatchBoxesOnPage(
  pageEl: HTMLElement,
  query: string,
  caseSensitive: boolean,
): Array<{ left: number; top: number; width: number; height: number }> {
  const q = normalizeForFind(query.trim(), caseSensitive);
  if (!q) {
    return [];
  }
  const pageRect = pageEl.getBoundingClientRect();
  const pw = pageRect.width || 1;
  const ph = pageRect.height || 1;
  const spans = pageEl.querySelectorAll<HTMLElement>(
    '.react-pdf__Page__textContent span, .textLayer span',
  );
  const boxes: Array<{ left: number; top: number; width: number; height: number }> = [];
  spans.forEach((el) => {
    const text = normalizeForFind(el.textContent ?? '', caseSensitive);
    if (!text || !text.includes(q.slice(0, Math.min(q.length, 12)))) {
      // Also accept when query contains span (glyph-split)
      if (!q.includes(text) || text.length < 1) {
        return;
      }
    }
    if (!text.includes(q) && !(q.length >= 2 && text.includes(q.slice(0, 2)))) {
      // Loose: span overlaps query token
      const token = q.split(' ')[0] ?? q;
      if (token.length < 2 || !text.includes(token)) {
        return;
      }
    }
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) {
      return;
    }
    boxes.push({
      left: ((r.left - pageRect.left) / pw) * 100,
      top: ((r.top - pageRect.top) / ph) * 100,
      width: (r.width / pw) * 100,
      height: (r.height / ph) * 100,
    });
  });
  return boxes.slice(0, 120);
}

/** Tighter match: rebuild from hit spans whose text participates in the query. */
export function findMatchBoxesStrict(
  pageEl: HTMLElement,
  query: string,
  caseSensitive: boolean,
): Array<{ left: number; top: number; width: number; height: number; rank: number }> {
  const q = normalizeForFind(query.trim(), caseSensitive);
  if (!q) {
    return [];
  }
  const pageRect = pageEl.getBoundingClientRect();
  const pw = pageRect.width || 1;
  const ph = pageRect.height || 1;
  const spans = [...pageEl.querySelectorAll<HTMLElement>(
    '.react-pdf__Page__textContent span, .textLayer span',
  )];
  const joined = spans
    .map((el) => normalizeForFind(el.textContent ?? '', caseSensitive))
    .join('');
  // Fallback to per-span containment when glyph join is messy
  const out: Array<{ left: number; top: number; width: number; height: number; rank: number }> =
    [];
  let rank = 0;
  for (const el of spans) {
    const t = normalizeForFind(el.textContent ?? '', caseSensitive);
    if (!t) {
      continue;
    }
    const hit =
      t.includes(q) ||
      q.includes(t) ||
      (q.length >= 3 && t.includes(q.slice(0, 3)));
    if (!hit) {
      continue;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) {
      continue;
    }
    out.push({
      left: ((r.left - pageRect.left) / pw) * 100,
      top: ((r.top - pageRect.top) / ph) * 100,
      width: (r.width / pw) * 100,
      height: (r.height / ph) * 100,
      rank: rank++,
    });
  }
  if (out.length === 0 && joined.includes(q)) {
    return findMatchBoxesOnPage(pageEl, query, caseSensitive).map((b, i) => ({
      ...b,
      rank: i,
    }));
  }
  return out.slice(0, 120);
}
