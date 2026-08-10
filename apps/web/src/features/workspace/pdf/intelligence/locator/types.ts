/**
 * EVO-003 — Locator Architecture (Stone Runtime).
 * Runtime locates text via TextRegion — no DOM types in this module.
 */

export type BBox = { x: number; y: number; w: number; h: number };

/** Abstract region of text on a page (geometry + primitive ids). */
export type TextRegion = {
  id: string;
  pageNumber: number;
  primitiveIds: string[];
  bbox: BBox;
  text: string;
  locatorId: string;
};

export type LocateQuery = {
  query: string;
  caseSensitive?: boolean;
};

export type PointHit = {
  x: number;
  y: number;
};
