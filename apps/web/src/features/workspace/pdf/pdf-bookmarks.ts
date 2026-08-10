/**
 * Native PDF outline/bookmarks via pdf.js — presentation navigation only.
 * Absolute Locks: no OCR/AI · raw immutable.
 */

export type PdfBookmarkEntry = {
  id: string;
  title: string;
  pageNumber: number;
  level: number;
};

type PdfJsDest = string | unknown[] | null;

type PdfJsOutlineNode = {
  title?: string;
  dest?: PdfJsDest;
  items?: PdfJsOutlineNode[];
};

type PdfJsProxy = {
  getOutline: () => Promise<PdfJsOutlineNode[] | null>;
  getDestination: (name: string) => Promise<unknown[] | null>;
  // pdf.js RefProxy — keep loose so PDFDocumentProxy assigns cleanly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPageIndex: (ref: any) => Promise<number>;
};

async function resolveDestPage(
  pdf: PdfJsProxy,
  dest: PdfJsDest | undefined,
): Promise<number | null> {
  if (dest == null) {
    return null;
  }
  try {
    let explicit: unknown[] | null = null;
    if (typeof dest === 'string') {
      explicit = await pdf.getDestination(dest);
    } else if (Array.isArray(dest)) {
      explicit = dest;
    }
    if (!explicit || explicit.length === 0) {
      return null;
    }
    const ref = explicit[0];
    const index = await pdf.getPageIndex(ref);
    if (!Number.isFinite(index) || index < 0) {
      return null;
    }
    return index + 1;
  } catch {
    return null;
  }
}

async function walk(
  pdf: PdfJsProxy,
  nodes: PdfJsOutlineNode[],
  level: number,
  out: PdfBookmarkEntry[],
  idPrefix: string,
): Promise<void> {
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i]!;
    const title = (node.title ?? '').replace(/\s+/g, ' ').trim();
    const pageNumber = (await resolveDestPage(pdf, node.dest ?? null)) ?? 1;
    const id = `${idPrefix}.${i}`;
    if (title) {
      out.push({ id, title, pageNumber, level });
    }
    if (node.items?.length) {
      await walk(pdf, node.items, level + 1, out, id);
    }
    if (out.length >= 400) {
      return;
    }
  }
}

/** Flatten pdf.js outline into navigable bookmarks (max 400). */
export async function extractPdfBookmarks(pdf: PdfJsProxy): Promise<PdfBookmarkEntry[]> {
  try {
    const outline = await pdf.getOutline();
    if (!outline?.length) {
      return [];
    }
    const out: PdfBookmarkEntry[] = [];
    await walk(pdf, outline, 0, out, 'bm');
    return out;
  } catch {
    return [];
  }
}
