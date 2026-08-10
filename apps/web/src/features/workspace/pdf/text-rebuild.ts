/**
 * Compatibility facade for P0.6 imports.
 * Implementation lives in the Document Structure Pipeline + plugins.
 */
export type {
  TextItemGeom,
  TextLine,
  TextParagraph,
  SelectionBlock,
  PageTextModel,
  PageStructureModel,
  PageDiagnostics,
  StructureRole,
} from './types';

export { joinLineItems, buildLines, collectItemsFromTextLayer } from './geometry';

export {
  aggregateDetectedModules,
  analyzePageElement,
  getDefaultPluginManager,
  rebuildPageTextModel,
  runDocumentStructurePipeline,
} from './pipeline';

export type {
  DetectedModule,
  StructureModuleId,
  WorkspaceViewMode,
} from './plugins/types';

import { buildReadingOrderParagraphs } from './reading-order';
import type { TextLine, TextParagraph, SelectionBlock } from './types';

/** Legacy 3-arg helper (no region exclusion). */
export function buildParagraphs(
  lines: TextLine[],
  pageWidth: number,
  pageHeight: number,
): TextParagraph[] {
  void pageHeight;
  return buildReadingOrderParagraphs(lines, [], pageWidth);
}

export function paragraphsToBlocks(paragraphs: TextParagraph[]): SelectionBlock[] {
  return paragraphs
    .filter((p) => p.text.length > 0)
    .map((p) => ({
      id: `block-${p.id}`,
      text: p.text,
      paragraphId: p.id,
      role: p.role,
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
    }));
}
