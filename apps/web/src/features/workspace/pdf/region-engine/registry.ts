/**
 * Region Plugin Manager + graph builder + capabilities.
 */

import type { TextItemGeom, TextLine } from '../types';
import {
  createAppendixRegionPlugin,
  createAttachmentRegionPlugin,
  createDefaultPartitionPlugin,
  createMetadataRegionPlugin,
} from './detectors';
import { attachObjectsFromStructurePlugins } from './objects';
import type {
  DocumentRegion,
  DocumentRegionGraph,
  RegionCapability,
  RegionDetectorPlugin,
  RegionDiagnostics,
} from './types';

export class RegionPluginManager {
  private plugins: RegionDetectorPlugin[] = [];

  register(plugin: RegionDetectorPlugin): void {
    this.plugins = [...this.plugins.filter((p) => p.id !== plugin.id), plugin].sort(
      (a, b) => a.priority - b.priority,
    );
  }

  list(): RegionDetectorPlugin[] {
    return [...this.plugins];
  }

  run(ctxBase: {
    pageNumber: number;
    pageWidth: number;
    pageHeight: number;
    items: TextItemGeom[];
    lines: TextLine[];
  }): DocumentRegion[] {
    const regions: DocumentRegion[] = [];
    const claimedItemIds = new Set<string>();
    const ctx = {
      ...ctxBase,
      regions,
      claimedItemIds,
    };
    for (const plugin of this.plugins) {
      plugin.detect(ctx);
    }
    return regions;
  }
}

let singleton: RegionPluginManager | null = null;

export function getDefaultRegionPluginManager(): RegionPluginManager {
  if (singleton) {
    return singleton;
  }
  const mgr = new RegionPluginManager();
  [
    createDefaultPartitionPlugin(),
    createAppendixRegionPlugin(),
    createAttachmentRegionPlugin(),
    createMetadataRegionPlugin(),
  ].forEach((p) => mgr.register(p));
  singleton = mgr;
  return mgr;
}

/** Reset singleton — tests only. */
export function resetRegionPluginManagerForTests(): void {
  singleton = null;
}

function buildDiagnostics(
  regions: DocumentRegion[],
  totalItems: number,
): RegionDiagnostics[] {
  return regions.map((r) => ({
    regionId: r.id,
    kind: r.kind,
    itemCount: r.itemIds.length,
    objectCount: r.objects.length,
    coverageRatio: totalItems === 0 ? 0 : r.itemIds.length / totalItems,
    readingOrderConfidence: r.confidence,
    selectionCoverage: r.selectable ? 1 : 0,
    missingHints: r.notes?.filter((n) => n === 'empty-band') ?? [],
  }));
}

function buildCapabilities(
  regions: DocumentRegion[],
  flags: Record<string, boolean>,
): RegionCapability[] {
  const has = (kind: DocumentRegion['kind']) =>
    regions.some((r) => r.kind === kind && r.itemIds.length > 0);
  const hasObj = (type: string) =>
    regions.some((r) => r.objects.some((o) => o.type === type || o.moduleId === type));

  return [
    { id: 'cap-header', labelVi: 'Đầu trang', present: has('header'), regionKinds: ['header'] },
    { id: 'cap-main', labelVi: 'Nội dung chính', present: has('main'), regionKinds: ['main'] },
    { id: 'cap-footer', labelVi: 'Cuối trang', present: has('footer'), regionKinds: ['footer'] },
    { id: 'cap-margin', labelVi: 'Lề', present: has('margin'), regionKinds: ['margin'] },
    {
      id: 'cap-table',
      labelVi: 'Bảng',
      present: hasObj('table') || Boolean(flags.table),
      regionKinds: ['main'],
      moduleId: 'table',
    },
    {
      id: 'cap-image',
      labelVi: 'Hình ảnh',
      present: hasObj('image') || Boolean(flags.image),
      regionKinds: ['main'],
      moduleId: 'image',
    },
    {
      id: 'cap-signature',
      labelVi: 'Chữ ký',
      present: hasObj('signature') || Boolean(flags.signature),
      regionKinds: ['footer', 'main'],
      moduleId: 'signature',
    },
    {
      id: 'cap-seal',
      labelVi: 'Con dấu',
      present: hasObj('seal') || Boolean(flags.stamp),
      regionKinds: ['footer'],
      moduleId: 'stamp',
    },
    {
      id: 'cap-watermark',
      labelVi: 'Watermark',
      present: hasObj('watermark') || Boolean(flags.watermark),
      regionKinds: ['main', 'header'],
      moduleId: 'watermark',
    },
    {
      id: 'cap-qr',
      labelVi: 'Mã QR',
      present: hasObj('qr-code') || Boolean(flags['qr-code']),
      regionKinds: ['header', 'footer', 'main'],
      moduleId: 'qr-code',
    },
    {
      id: 'cap-appendix',
      labelVi: 'Phụ lục',
      present: has('appendix') || Boolean(flags.annex),
      regionKinds: ['appendix'],
      moduleId: 'annex',
    },
    {
      id: 'cap-attachment',
      labelVi: 'Đính kèm',
      present: has('attachment') || Boolean(flags.attachment),
      regionKinds: ['attachment'],
      moduleId: 'attachment',
    },
  ];
}

function readingRegionOrder(regions: DocumentRegion[]): string[] {
  const rank = (k: DocumentRegion['kind']): number => {
    switch (k) {
      case 'header':
        return 10;
      case 'metadata':
        return 15;
      case 'main':
        return 20;
      case 'appendix':
        return 30;
      case 'attachment':
        return 40;
      case 'footer':
        return 50;
      case 'margin':
        return 60;
      default:
        return 70;
    }
  };
  return [...regions]
    .filter((r) => !r.excludeFromDocumentReadingOrder || r.kind === 'main')
    .sort((a, b) => rank(a.kind) - rank(b.kind) || a.y - b.y)
    .map((r) => r.id);
}

export function buildDocumentRegionGraph(args: {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  items: TextItemGeom[];
  lines: TextLine[];
  manager?: RegionPluginManager;
}): {
  graph: DocumentRegionGraph;
  structureRegions: import('../types').StructureRegion[];
  moduleFlags: Record<string, boolean>;
} {
  const mgr = args.manager ?? getDefaultRegionPluginManager();
  let regions = mgr.run({
    pageNumber: args.pageNumber,
    pageWidth: args.pageWidth,
    pageHeight: args.pageHeight,
    items: args.items,
    lines: args.lines,
  });

  const attached = attachObjectsFromStructurePlugins(
    regions,
    args.pageNumber,
    args.pageWidth,
    args.pageHeight,
    args.items,
    args.lines,
  );
  regions = attached.regions;

  const graph: DocumentRegionGraph = {
    pageNumber: args.pageNumber,
    pageWidth: args.pageWidth,
    pageHeight: args.pageHeight,
    regions,
    readingRegionOrder: readingRegionOrder(regions),
    diagnostics: buildDiagnostics(regions, args.items.length),
    capabilities: buildCapabilities(regions, attached.flags),
  };

  return {
    graph,
    structureRegions: attached.structureRegions,
    moduleFlags: attached.flags,
  };
}
