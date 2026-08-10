/**
 * ITextLocator — provider/DOM independent location of text regions.
 */

import type { TextPrimitivePage } from '../input/types';
import type { LocateQuery, PointHit, TextRegion } from './types';

export interface ITextLocator {
  readonly id: string;
  readonly version: string;
  /** Regions covering the given primitive ids. */
  locateByPrimitiveIds(page: TextPrimitivePage, ids: ReadonlyArray<string>): TextRegion[];
  /** Regions whose text matches query (deterministic substring). */
  locateByQuery(page: TextPrimitivePage, query: LocateQuery): TextRegion[];
  /** Hit-test a point in page coordinates. */
  locateByPoint(page: TextPrimitivePage, point: PointHit): TextRegion | null;
  /** Union bbox of all primitives (page extent of text). */
  locateAll(page: TextPrimitivePage): TextRegion[];
}
