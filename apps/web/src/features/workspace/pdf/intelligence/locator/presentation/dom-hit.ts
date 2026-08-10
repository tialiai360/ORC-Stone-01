/**
 * Presentation-only: map DOM selection → primitive ids.
 * NOT part of Stone Runtime core — must not be imported by DOI/Knowledge paths.
 */

export type DomHitContext = {
  /** Opaque page root — typed unknown so Runtime packages never require DOM lib. */
  pageRoot: unknown;
  range: unknown;
};

/**
 * Extract orc item ids intersecting a browser Range.
 * Implemented with duck-typing so unit tests can stub without jsdom.
 */
export function hitPrimitiveIdsFromDomSelection(ctx: DomHitContext): string[] {
  const pageRoot = ctx.pageRoot as {
    querySelectorAll?: (sel: string) => ArrayLike<{ dataset?: { orcItemId?: string } }>;
  } | null;
  const range = ctx.range as {
    compareBoundaryPoints?: (how: number, other: unknown) => number;
  } | null;

  if (!pageRoot?.querySelectorAll || !range?.compareBoundaryPoints) {
    return [];
  }

  // Browser constants
  const END_TO_START = 2;
  const START_TO_END = 3;
  const doc = (globalThis as { document?: { createRange?: () => {
    selectNodeContents: (n: unknown) => void;
  } } }).document;

  if (!doc?.createRange) {
    return [];
  }

  const spans = pageRoot.querySelectorAll(
    '.react-pdf__Page__textContent span, .textLayer span',
  );
  const ids: string[] = [];
  for (let i = 0; i < spans.length; i += 1) {
    const el = spans[i] as {
      dataset?: { orcItemId?: string };
    } & object;
    const id = el.dataset?.orcItemId;
    if (!id) {
      continue;
    }
    try {
      const er = doc.createRange();
      er.selectNodeContents(el);
      if (
        range.compareBoundaryPoints(END_TO_START, er) < 0 &&
        range.compareBoundaryPoints(START_TO_END, er) > 0
      ) {
        ids.push(id);
      }
    } catch {
      /* skip */
    }
  }
  return ids;
}
