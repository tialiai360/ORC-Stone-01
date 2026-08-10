/**
 * Document Understanding Pipeline (Master Evolution / EVO-002).
 * Input Runtime → DPL → DOI → Region Engine → Reading Order → Selection
 * Does not mutate PDF bytes. Provider-agnostic after extract.
 */

import { buildDiagnostics } from './diagnostics';
import { detectLayoutKind } from './detect-layout';
import { buildLines } from './geometry';
import { enrichTableRegionMarkdown } from '../knowledge/table-grid';
import { isDoiEngineEnabled, runDoiEngine } from './intelligence';
import type { DocumentObjectGraph } from './intelligence';
import type { DocumentPrimitivePage } from './intelligence/dpl/types';
import {
  getDefaultInputRuntime,
  textPrimitivePageToDpl,
  textPrimitivePageToGeomItems,
} from './intelligence/input';
import { buildSelectionBlocks, markOrphans } from './reading-order';
import {
  buildDocumentRegionGraph,
  buildRegionFirstReadingOrder,
  buildRegionSelectionBlocks,
  documentRegionsToStructureRegions,
} from './region-engine';
import type { StructureModuleId } from './plugins/types';
import type { DocumentObjectType } from './region-engine/types';
import type { PageStructureModel, StructureRegion } from './types';
import type { ObjectClass } from './intelligence/doi/types';

function doiClassToObjectType(cls: ObjectClass): DocumentObjectType {
  switch (cls) {
    case 'table':
    case 'table-border':
      return 'table';
    case 'watermark':
      return 'watermark';
    case 'signature':
      return 'signature';
    case 'digital-signature':
      return 'digital-signature';
    case 'seal':
    case 'stamp':
      return 'seal';
    case 'logo':
      return 'logo';
    case 'qr-code':
      return 'qr-code';
    case 'barcode':
      return 'barcode';
    case 'photo':
    case 'icon':
    case 'diagram':
    case 'chart':
      return 'image';
    case 'annotation':
      return 'annotation';
    case 'heading':
    case 'title':
    case 'subtitle':
    case 'body-text':
    case 'header':
    case 'footer':
    case 'footnote':
    case 'margin-note':
      return 'text';
    case 'appendix':
    case 'attachment':
      return 'other';
    default:
      return 'other';
  }
}

export type { PageStructureModel, PageTextModel, PageDiagnostics } from './types';
export { collectItemsFromTextLayer, buildLines, joinLineItems } from './geometry';
export type { StructureModuleId, DetectedModule, WorkspaceViewMode } from './plugins/types';
export { aggregateDetectedModules, getDefaultPluginManager } from './plugins/registry';
export {
  buildDocumentRegionGraph,
  getDefaultRegionPluginManager,
} from './region-engine';

function mergeDoiIntoRegionCapabilities(
  graph: NonNullable<PageStructureModel['regionGraph']>,
  doi: DocumentObjectGraph,
): void {
  const byId = new Map(graph.capabilities.map((c) => [c.id, c]));
  const classCount = doi.diagnostics.byClass;
  const countForCap = (capId: string): number => {
    switch (capId) {
      case 'cap-header':
        return (classCount.header ?? 0) + (classCount.title ?? 0);
      case 'cap-footer':
        return classCount.footer ?? 0;
      case 'cap-table':
        return classCount.table ?? 0;
      case 'cap-image':
        return (classCount.photo ?? 0) + (classCount.icon ?? 0);
      case 'cap-watermark':
        return classCount.watermark ?? 0;
      case 'cap-signature':
        return (classCount.signature ?? 0) + (classCount['digital-signature'] ?? 0);
      case 'cap-seal':
        return (classCount.seal ?? 0) + (classCount.stamp ?? 0);
      case 'cap-qr':
        return (classCount['qr-code'] ?? 0) + (classCount.barcode ?? 0);
      case 'cap-appendix':
        return classCount.appendix ?? 0;
      case 'cap-attachment':
        return classCount.attachment ?? 0;
      default:
        return 0;
    }
  };

  for (const oc of doi.capabilities) {
    const mapped = oc.id === 'ocap-text' ? null : oc.id.replace(/^ocap-/, 'cap-');
    if (!mapped) {
      continue;
    }
    const existing = byId.get(mapped);
    if (existing) {
      existing.present = existing.present || oc.present;
      existing.doiConfirmed = existing.doiConfirmed || oc.present;
      const n = countForCap(mapped);
      if (n > 0) {
        existing.objectCount = Math.max(existing.objectCount ?? 0, n);
      }
    }
  }
  const img = byId.get('cap-image');
  if (img) {
    img.present =
      img.present || doi.capabilities.some((c) => c.id === 'ocap-image' && c.present);
  }
}

/**
 * Region-first Document Understanding Pipeline (+ optional DOI first stage).
 */
export function runDocumentStructurePipeline(
  itemsIn: import('./types').TextItemGeom[],
  pageWidth: number,
  pageHeight: number,
  pageNumber = 1,
  options?: {
    pageEl?: HTMLElement | null;
    enableDoi?: boolean;
    /** Pre-extracted DPL page from Input Runtime (skips re-extract). */
    primitives?: DocumentPrimitivePage;
  },
): PageStructureModel {
  const items = itemsIn.map((i) => ({ ...i, flags: { ...i.flags } }));
  const lines = buildLines(items.filter((i) => !i.flags?.invisible));

  const enableDoi = options?.enableDoi ?? isDoiEngineEnabled();
  let objectGraph: DocumentObjectGraph | undefined;
  if (enableDoi) {
    objectGraph = runDoiEngine({
      pageNumber,
      pageWidth,
      pageHeight,
      textItems: items,
      pageEl: options?.pageEl,
      primitives: options?.primitives,
    });
  }

  const { graph, structureRegions, moduleFlags } = buildDocumentRegionGraph({
    pageNumber,
    pageWidth,
    pageHeight,
    items,
    lines,
  });

  if (objectGraph) {
    mergeDoiIntoRegionCapabilities(graph, objectGraph);
    // Nest high-signal DOI objects into matching regions (additive).
    for (const obj of objectGraph.objects) {
      if (obj.class === 'body-text' || obj.class === 'unknown') {
        continue;
      }
      if (obj.confidenceScore < 0.55) {
        continue;
      }
      const region =
        graph.regions.find((r) => r.kind === obj.regionHint) ??
        graph.regions.find((r) => r.kind === 'main');
      if (!region) {
        continue;
      }
      const already = region.objects.some((o) =>
        obj.textItemIds.some((id) => o.itemIds.includes(id)),
      );
      if (already) {
        continue;
      }
      const type = doiClassToObjectType(obj.class);
      region.objects.push({
        id: obj.id,
        type,
        text: obj.text,
        itemIds: obj.textItemIds,
        confidence: obj.confidence,
        regionId: region.id,
        layer:
          obj.class === 'watermark'
            ? 'security'
            : type === 'image' || type === 'chart' || type === 'qr-code'
              ? 'media'
              : type === 'logo' || type === 'page-number'
                ? 'chrome'
                : 'content',
        x: obj.bbox.x,
        y: obj.bbox.y,
        w: obj.bbox.w,
        h: obj.bbox.h,
        moduleId:
          obj.class === 'seal' || obj.class === 'stamp'
            ? 'stamp'
            : type === 'image'
              ? 'image'
              : obj.class === 'appendix'
                ? 'annex'
                : obj.class === 'watermark'
                  ? 'watermark'
                  : obj.class === 'signature'
                    ? 'signature'
                    : undefined,
      });
    }
  }

  const paragraphs = buildRegionFirstReadingOrder(graph, lines);

  const adapted = documentRegionsToStructureRegions(graph);
  const mergedRegions: StructureRegion[] = mergeStructureRegions(adapted, structureRegions);
  const regions: StructureRegion[] = mergedRegions.map((r) =>
    r.kind === 'table' || r.moduleId === 'table' ? enrichTableRegionMarkdown(r, lines) : r,
  );

  const regionBlocks = buildRegionSelectionBlocks(paragraphs, graph);
  const supplemental = buildSelectionBlocks([], regions, lines).filter(
    (b) => b.role !== 'body',
  );
  const blocks = [...regionBlocks, ...supplemental];

  const itemsMarked = markOrphans(items, lines, regions);

  const corpus = paragraphs.map((p) => p.text).join('\n');
  const selectableCorpus = blocks.map((b) => b.text).join('\n');
  const usableCharCount = selectableCorpus.replace(/\s+/g, '').length;
  const layout = detectLayoutKind(lines, pageWidth, regions);

  const partial = {
    pageWidth,
    pageHeight,
    items: itemsMarked,
    lines,
    paragraphs,
    regions,
    blocks,
    corpus,
    selectableCorpus,
    usableCharCount,
    hasUsableText: usableCharCount >= 3,
    moduleFlags: moduleFlags as Partial<Record<StructureModuleId, boolean>>,
    regionGraph: graph,
    objectGraph,
  };

  const diagnostics = buildDiagnostics(pageNumber, partial, layout);
  if (objectGraph) {
    diagnostics.objectTotal = objectGraph.diagnostics.totalObjects;
    diagnostics.objectRecognized = objectGraph.diagnostics.recognizedObjects;
    diagnostics.objectUnknown = objectGraph.diagnostics.unknownObjects;
    diagnostics.objectCoverage = objectGraph.diagnostics.objectCoverage;
    diagnostics.objectByClass = { ...objectGraph.diagnostics.byClass };
    if (objectGraph.diagnostics.notes.length) {
      diagnostics.notes = [...diagnostics.notes, ...objectGraph.diagnostics.notes];
    }
  }

  return {
    ...partial,
    diagnostics,
  };
}

function mergeStructureRegions(
  adapted: StructureRegion[],
  fromPlugins: StructureRegion[],
): StructureRegion[] {
  const seen = new Set(adapted.map((r) => `${r.moduleId}:${r.x}:${r.y}:${r.w}`));
  const out = [...adapted];
  for (const r of fromPlugins) {
    const key = `${r.moduleId}:${r.x}:${r.y}:${r.w}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

export function analyzePageElement(
  pageEl: HTMLElement,
  pageNumber = 1,
): PageStructureModel {
  const runtime = getDefaultInputRuntime();
  const textPage = runtime.extractPage({
    documentId: `page-${pageNumber}`,
    pageNumber,
    pageWidth: 0,
    pageHeight: 0,
    context: { pageEl },
  });
  const items = textPrimitivePageToGeomItems(textPage);
  const primitives = textPrimitivePageToDpl(textPage);
  return runDocumentStructurePipeline(
    items,
    textPage.pageWidth,
    textPage.pageHeight,
    pageNumber,
    { pageEl, primitives },
  );
}

export function rebuildPageTextModel(
  items: import('./types').TextItemGeom[],
  pageWidth: number,
  pageHeight: number,
  pageNumber = 1,
): PageStructureModel {
  return runDocumentStructurePipeline(items, pageWidth, pageHeight, pageNumber, {
    enableDoi: true,
  });
}

export function headerTextFromRegions(regions: StructureRegion[]): string | undefined {
  return regions.find((r) => r.moduleId === 'header')?.text;
}

export function footerTextFromRegions(regions: StructureRegion[]): string | undefined {
  return regions.find((r) => r.moduleId === 'footer')?.text;
}
