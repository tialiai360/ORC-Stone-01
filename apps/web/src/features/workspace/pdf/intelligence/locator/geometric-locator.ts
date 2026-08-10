/**
 * Geometric Text locator — pure TextPrimitivePage geometry (no DOM).
 */

import type { TextPrimitive, TextPrimitivePage } from '../input/types';
import type { ITextLocator } from './locator';
import type { BBox, LocateQuery, PointHit, TextRegion } from './types';

export const GEOMETRIC_LOCATOR_ID = 'locator.geometric.v1';
export const GEOMETRIC_LOCATOR_VERSION = '1.0.0';

function unionBBox(boxes: BBox[]): BBox {
  if (boxes.length === 0) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of boxes) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  return { x: minX, y: minY, w: Math.max(0, maxX - minX), h: Math.max(0, maxY - minY) };
}

function regionFromPrimitives(
  page: TextPrimitivePage,
  prims: TextPrimitive[],
  idSuffix: string,
): TextRegion | null {
  if (prims.length === 0) {
    return null;
  }
  return {
    id: `region-${page.pageNumber}-${idSuffix}`,
    pageNumber: page.pageNumber,
    primitiveIds: prims.map((p) => p.id),
    bbox: unionBBox(prims.map((p) => p.bbox)),
    text: prims
      .map((p) => p.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
    locatorId: GEOMETRIC_LOCATOR_ID,
  };
}

function containsPoint(b: BBox, x: number, y: number): boolean {
  return x >= b.x && y >= b.y && x <= b.x + b.w && y <= b.y + b.h;
}

export function createGeometricTextLocator(): ITextLocator {
  return {
    id: GEOMETRIC_LOCATOR_ID,
    version: GEOMETRIC_LOCATOR_VERSION,
    locateByPrimitiveIds(page, ids) {
      const set = new Set(ids);
      const prims = page.primitives.filter((p) => set.has(p.id) || (p.textItemId && set.has(p.textItemId)));
      const r = regionFromPrimitives(page, prims, `ids-${[...set].slice(0, 3).join('_')}`);
      return r ? [r] : [];
    },
    locateByQuery(page, query: LocateQuery) {
      const q = query.caseSensitive ? query.query.trim() : query.query.trim().toLowerCase();
      if (!q) {
        return [];
      }
      const out: TextRegion[] = [];
      page.primitives.forEach((p, i) => {
        const hay = query.caseSensitive ? p.text : p.text.toLowerCase();
        if (hay.includes(q)) {
          const r = regionFromPrimitives(page, [p], `q-${i}`);
          if (r) {
            out.push(r);
          }
        }
      });
      return out.slice(0, 200);
    },
    locateByPoint(page, point: PointHit) {
      const hits = page.primitives.filter((p) => containsPoint(p.bbox, point.x, point.y));
      return regionFromPrimitives(page, hits, `pt-${Math.round(point.x)}-${Math.round(point.y)}`);
    },
    locateAll(page) {
      const r = regionFromPrimitives(page, page.primitives, 'all');
      return r ? [r] : [];
    },
  };
}
