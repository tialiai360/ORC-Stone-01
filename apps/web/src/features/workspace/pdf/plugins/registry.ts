import type { StructureRegion } from '../types';
import { createLegalStructurePlugin } from '../../dpk/legal-structure';
import {
  createAnnexPlugin,
  createFooterPlugin,
  createFootnotePlugin,
  createHeaderPlugin,
  createLogoPlugin,
  createPageFlagsPlugin,
  createPageNumberPlugin,
  createQrBarcodePlugin,
  createSignaturePlugin,
  createTablePlugin,
  createWatermarkPlugin,
} from './detectors';
import type {
  DetectedModule,
  DetectorContext,
  StructureDetectorPlugin,
  StructureModuleId,
} from './types';
import { MODULE_LABELS_VI } from './types';

/**
 * Plugin Manager — registers structure detectors.
 * PDF Viewer consumes results only; analysis stays here.
 */
export class StructurePluginManager {
  private plugins: StructureDetectorPlugin[] = [];

  register(plugin: StructureDetectorPlugin): void {
    this.plugins = [...this.plugins.filter((p) => p.id !== plugin.id), plugin].sort(
      (a, b) => a.priority - b.priority,
    );
  }

  list(): StructureDetectorPlugin[] {
    return [...this.plugins];
  }

  run(ctx: DetectorContext): {
    regions: StructureRegion[];
    flags: Partial<Record<StructureModuleId, boolean>>;
  } {
    const regions: StructureRegion[] = [];
    const flags: Partial<Record<StructureModuleId, boolean>> = {};
    for (const plugin of this.plugins) {
      const result = plugin.detect(ctx);
      regions.push(...result.regions);
      if (result.flags) {
        Object.assign(flags, result.flags);
      }
      if (result.regions.length > 0) {
        flags[result.moduleId] = true;
      }
    }
    return { regions, flags };
  }
}

let singleton: StructurePluginManager | null = null;

/** Default registered detectors (extensible). */
export function getDefaultPluginManager(): StructurePluginManager {
  if (singleton) {
    return singleton;
  }
  const mgr = new StructurePluginManager();
  [
    createHeaderPlugin(),
    createLogoPlugin(),
    createFooterPlugin(),
    createSignaturePlugin(),
    createWatermarkPlugin(),
    createTablePlugin(),
    createLegalStructurePlugin(),
    createPageNumberPlugin(),
    createQrBarcodePlugin(),
    createFootnotePlugin(),
    createAnnexPlugin(),
    createPageFlagsPlugin(),
  ].forEach((p) => mgr.register(p));
  singleton = mgr;
  return mgr;
}

/** Aggregate detected modules for UI (only present ones). */
export function aggregateDetectedModules(
  pageResults: Array<{
    pageNumber: number;
    regions: StructureRegion[];
    flags: Partial<Record<StructureModuleId, boolean>>;
    headerText?: string;
    footerText?: string;
  }>,
): DetectedModule[] {
  const map = new Map<
    StructureModuleId,
    { pages: Set<number>; regionCount: number; sample?: string }
  >();

  const bump = (id: StructureModuleId, page: number, sample?: string, regions = 0) => {
    const cur = map.get(id) ?? { pages: new Set<number>(), regionCount: 0 };
    cur.pages.add(page);
    cur.regionCount += regions;
    if (sample && !cur.sample) {
      cur.sample = sample;
    }
    map.set(id, cur);
  };

  const headerTexts: string[] = [];
  const footerTexts: string[] = [];

  for (const page of pageResults) {
    for (const r of page.regions) {
      const mid = (r.moduleId as StructureModuleId) || undefined;
      if (mid) {
        bump(mid, page.pageNumber, r.text, 1);
      }
    }
    for (const [flag, on] of Object.entries(page.flags)) {
      if (on) {
        bump(flag as StructureModuleId, page.pageNumber);
      }
    }
    if (page.headerText) {
      headerTexts.push(page.headerText);
    }
    if (page.footerText) {
      footerTexts.push(page.footerText);
    }
  }

  // Repeated header/footer across pages
  if (headerTexts.length >= 2) {
    const norm = headerTexts.map((t) => t.replace(/\s+/g, ' ').trim().toLowerCase());
    const first = norm[0]!;
    if (first.length > 8 && norm.filter((t) => t === first).length >= 2) {
      bump('repeated-header', 1, headerTexts[0]);
      pageResults.forEach((p) => bump('repeated-header', p.pageNumber));
    }
  }
  if (footerTexts.length >= 2) {
    const norm = footerTexts.map((t) => t.replace(/\s+/g, ' ').trim().toLowerCase());
    const first = norm[0]!;
    if (first.length > 4 && norm.filter((t) => t === first).length >= 2) {
      bump('repeated-footer', 1, footerTexts[0]);
      pageResults.forEach((p) => bump('repeated-footer', p.pageNumber));
    }
  }

  return [...map.entries()]
    .filter(([, v]) => v.pages.size > 0 || v.regionCount > 0)
    .map(([moduleId, v]) => ({
      moduleId,
      labelVi: MODULE_LABELS_VI[moduleId] ?? moduleId,
      pageNumbers: [...v.pages].sort((a, b) => a - b),
      regionCount: v.regionCount,
      sampleText: v.sample?.slice(0, 120),
      actionable: v.regionCount > 0,
    }))
    .sort(
      (a, b) =>
        Number(b.actionable) - Number(a.actionable) || a.labelVi.localeCompare(b.labelVi, 'vi'),
    );
}
