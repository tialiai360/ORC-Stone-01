/**
 * Specialized region detectors — pluggable, heuristic, no OCR/AI.
 */

import { boundsOf } from '../geometry';
import type { DocumentRegion, RegionDetectorPlugin } from './types';
import { REGION_LABELS_VI } from './types';
import { partitionDefaultBands, refineBandConfidence } from './partition';

export function createDefaultPartitionPlugin(): RegionDetectorPlugin {
  return {
    id: 'DefaultBandPartition',
    regionKind: 'main',
    labelVi: 'Phân vùng mặc định',
    priority: 10,
    detect: (ctx) => {
      const bands = refineBandConfidence(partitionDefaultBands(ctx), ctx.lines);
      // Replace empty accumulation
      ctx.regions.length = 0;
      ctx.regions.push(...bands);
      bands.forEach((r) => r.itemIds.forEach((id) => ctx.claimedItemIds.add(id)));
      return bands;
    },
  };
}

export function createAppendixRegionPlugin(): RegionDetectorPlugin {
  return {
    id: 'AppendixRegionDetector',
    regionKind: 'appendix',
    labelVi: 'Phụ lục',
    priority: 40,
    detect: (ctx) => {
      const hits = ctx.lines.filter((l) =>
        /^(phụ\s*lục|annex|appendix)\b/i.test(l.text.trim()),
      );
      if (hits.length === 0) {
        return [];
      }
      const itemIds = hits.flatMap((l) => l.items.map((i) => i.id));
      const region: DocumentRegion = {
        id: `region-appendix-${ctx.pageNumber}`,
        kind: 'appendix',
        labelVi: REGION_LABELS_VI.appendix,
        pageNumber: ctx.pageNumber,
        itemIds,
        confidence: 'HIGH',
        excludeFromDocumentReadingOrder: false,
        selectable: true,
        objects: [],
        ...boundsOf(hits),
        notes: ['cue:phu-luc'],
      };
      // Demote overlapping main items note — keep both; reading order prefers appendix stream later
      ctx.regions.push(region);
      return [region];
    },
  };
}

export function createAttachmentRegionPlugin(): RegionDetectorPlugin {
  return {
    id: 'AttachmentRegionDetector',
    regionKind: 'attachment',
    labelVi: 'Đính kèm',
    priority: 45,
    detect: (ctx) => {
      const hits = ctx.lines.filter((l) =>
        /^(đính\s*kèm|attachment)\b/i.test(l.text.trim()),
      );
      if (hits.length === 0) {
        return [];
      }
      const itemIds = hits.flatMap((l) => l.items.map((i) => i.id));
      const region: DocumentRegion = {
        id: `region-attachment-${ctx.pageNumber}`,
        kind: 'attachment',
        labelVi: REGION_LABELS_VI.attachment,
        pageNumber: ctx.pageNumber,
        itemIds,
        confidence: 'HIGH',
        excludeFromDocumentReadingOrder: false,
        selectable: true,
        objects: [],
        ...boundsOf(hits),
      };
      ctx.regions.push(region);
      return [region];
    },
  };
}

export function createMetadataRegionPlugin(): RegionDetectorPlugin {
  return {
    id: 'MetadataRegionDetector',
    regionKind: 'metadata',
    labelVi: 'Metadata',
    priority: 50,
    detect: (ctx) => {
      const header = ctx.regions.find((r) => r.kind === 'header');
      if (!header) {
        return [];
      }
      const metaLines = ctx.lines.filter(
        (l) =>
          l.items.some((i) => header.itemIds.includes(i.id)) &&
          /(số\s*:|ngày\s*:|v\/v|về\s*việc)/i.test(l.text),
      );
      if (metaLines.length === 0) {
        return [];
      }
      const itemIds = metaLines.flatMap((l) => l.items.map((i) => i.id));
      const region: DocumentRegion = {
        id: `region-metadata-${ctx.pageNumber}`,
        kind: 'metadata',
        labelVi: REGION_LABELS_VI.metadata,
        pageNumber: ctx.pageNumber,
        itemIds,
        confidence: 'MEDIUM',
        excludeFromDocumentReadingOrder: true,
        selectable: true,
        objects: [],
        parentId: header.id,
        ...boundsOf(metaLines),
      };
      ctx.regions.push(region);
      return [region];
    },
  };
}
