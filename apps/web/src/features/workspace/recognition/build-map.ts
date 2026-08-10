import type { StructureRegion } from '../pdf/types';
import type { PageStructureSnapshot } from '../pdf/viewer-types';
import type { DisplayObjectInsight, RecognitionMapCell, RecognitionSummary } from './types';
import type { DetectedModule } from '../pdf/plugins/types';
import type { RegionCapability } from '../pdf/region-engine/types';

function regionToCell(
  r: StructureRegion,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
): RecognitionMapCell | null {
  if (!pageWidth || !pageHeight || r.w <= 0 || r.h <= 0) {
    return null;
  }
  return {
    id: `region:${r.id}`,
    source: 'region',
    label: r.label || r.kind,
    pageNumber,
    left: (r.x / pageWidth) * 100,
    top: (r.y / pageHeight) * 100,
    width: (r.w / pageWidth) * 100,
    height: (r.h / pageHeight) * 100,
    moduleId: r.moduleId,
  };
}

/**
 * Build a spatial Recognition Map for one page from snapshot + display objects.
 * Additive overview — does not replace structure/object panels.
 */
export function buildRecognitionMap(
  snapshot: PageStructureSnapshot | undefined,
  objects: DisplayObjectInsight[],
): RecognitionMapCell[] {
  if (!snapshot) {
    return [];
  }
  const cells: RecognitionMapCell[] = [];
  const pw = snapshot.pageWidth ?? 0;
  const ph = snapshot.pageHeight ?? 0;

  for (const r of snapshot.regions ?? []) {
    const cell = regionToCell(r, snapshot.pageNumber, pw, ph);
    if (cell) {
      cells.push(cell);
    }
  }

  for (const o of objects.filter((x) => x.pageNumber === snapshot.pageNumber && !x.rejected)) {
    cells.push({
      id: `object:${o.id}`,
      source: 'object',
      label: o.displayClass,
      pageNumber: o.pageNumber,
      left: o.left,
      top: o.top,
      width: o.width,
      height: o.height,
      objectClass: o.displayClass,
      confidenceScore: o.confidenceScore,
      corrected: o.corrected,
      rejected: o.rejected,
    });
  }

  return cells;
}

export function buildRecognitionSummary(input: {
  pagesAnalyzed: number;
  objects: DisplayObjectInsight[];
  modules: DetectedModule[];
  capabilities: RegionCapability[];
  correctionCount: number;
}): RecognitionSummary {
  const live = input.objects.filter((o) => !o.rejected);
  return {
    pagesAnalyzed: input.pagesAnalyzed,
    objectCount: live.length,
    moduleCount: input.modules.filter((m) => m.actionable).length,
    capabilityPresent: input.capabilities.filter((c) => c.present).length,
    capabilityTotal: input.capabilities.length,
    correctionCount: input.correctionCount,
    rejectedCount: input.objects.filter((o) => o.rejected).length,
    lowConfidenceCount: live.filter((o) => o.confidenceScore < 0.55).length,
  };
}
