/**
 * Document Structure Pipeline — Interaction Layer only.
 * Does not mutate PDF bytes. Text comes from Input Runtime providers.
 */

export type Rect = { x: number; y: number; w: number; h: number };

export type TextItemGeom = Rect & {
  id: string;
  text: string;
  /** Degrees if detectable from CSS transform; else 0. */
  rotationDeg?: number;
  opacityHint?: number;
  flags?: {
    invisible?: boolean;
    orphan?: boolean;
    watermark?: boolean;
  };
};

export type TextLine = Rect & {
  id: string;
  text: string;
  items: TextItemGeom[];
};

export type StructureRole =
  | 'body'
  | 'header'
  | 'footer'
  | 'signature'
  | 'table'
  | 'table-cell'
  | 'stamp'
  | 'watermark'
  | 'sidebar';

export type LayoutKind =
  | 'single-column'
  | 'multi-column'
  | 'table'
  | 'nested-table'
  | 'sidebar'
  | 'header-block'
  | 'footer-block'
  | 'signature-block'
  | 'stamp-block'
  | 'mixed';

export type TextParagraph = Rect & {
  id: string;
  text: string;
  lines: TextLine[];
  role: StructureRole;
};

export type StructureRegion = Rect & {
  id: string;
  kind: LayoutKind | 'header' | 'footer' | 'watermark' | 'signature' | 'table' | 'stamp';
  label: string;
  text: string;
  itemIds: string[];
  /** Excluded from main reading-order corpus when true. */
  excludeFromReadingOrder: boolean;
  /** Still selectable for annotation when true. */
  selectable: boolean;
  /** Structure module id for visibility control (Presentation Layer). */
  moduleId?: string;
};

export type SelectionBlock = Rect & {
  id: string;
  text: string;
  paragraphId: string;
  role: StructureRole;
  regionId?: string;
};

export type PageDiagnostics = {
  pageNumber: number;
  textItems: number;
  lines: number;
  paragraphs: number;
  tables: number;
  headers: number;
  footers: number;
  watermarks: number;
  signatures: number;
  selectionBlocks: number;
  orphanText: number;
  invisibleText: number;
  selectableCoverage: number;
  readingOrderConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  layout: LayoutKind;
  notes: string[];
  /** EVO-002 DOI */
  objectTotal?: number;
  objectRecognized?: number;
  objectUnknown?: number;
  objectCoverage?: number;
  objectByClass?: Partial<Record<string, number>>;
};

export type PageStructureModel = {
  pageWidth: number;
  pageHeight: number;
  items: TextItemGeom[];
  lines: TextLine[];
  paragraphs: TextParagraph[];
  /** Legacy structure regions (adapted from Region Graph for module UI). */
  regions: StructureRegion[];
  blocks: SelectionBlock[];
  /** Body reading-order corpus (no header/footer/watermark). */
  corpus: string;
  /** Full selectable corpus including signature/table cells. */
  selectableCorpus: string;
  usableCharCount: number;
  hasUsableText: boolean;
  diagnostics: PageDiagnostics;
  /** Plugin flags for modules without geometry (empty-page, multi-column, …). */
  moduleFlags?: Partial<Record<string, boolean>>;
  /** EVO-001F Region Engine SoT for layout. */
  regionGraph?: import('./region-engine/types').DocumentRegionGraph;
  /** EVO-002 Document Object Intelligence graph. */
  objectGraph?: import('./intelligence/doi/types').DocumentObjectGraph;
};

/** @deprecated alias — P0.6 compatibility */
export type PageTextModel = PageStructureModel;
