/**
 * EVO-001F — Document Region Engine types.
 * Layout SoT for Document Understanding Pipeline. No OCR / AI. Raw immutable.
 */

import type { Rect, TextItemGeom, TextLine } from '../types';

/** Default logical page partitions. */
export type DocumentRegionKind =
  | 'header'
  | 'main'
  | 'footer'
  | 'margin'
  | 'metadata'
  | 'attachment'
  | 'appendix'
  | 'unknown';

export type DocumentObjectType =
  | 'text'
  | 'table'
  | 'image'
  | 'logo'
  | 'watermark'
  | 'seal'
  | 'signature'
  | 'digital-signature'
  | 'qr-code'
  | 'barcode'
  | 'vector'
  | 'chart'
  | 'annotation'
  | 'page-number'
  | 'legal-unit'
  | 'subject'
  | 'other';

export type RegionConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type DocumentObject = Rect & {
  id: string;
  type: DocumentObjectType;
  text?: string;
  itemIds: string[];
  confidence: RegionConfidence;
  /** Presentation / structure module bridge. */
  moduleId?: string;
  regionId: string;
  layer: 'content' | 'chrome' | 'security' | 'media';
};

export type DocumentRegion = Rect & {
  id: string;
  kind: DocumentRegionKind;
  labelVi: string;
  pageNumber: number;
  itemIds: string[];
  confidence: RegionConfidence;
  /** Main reading stream for this region (exclude chrome objects). */
  excludeFromDocumentReadingOrder: boolean;
  selectable: boolean;
  objects: DocumentObject[];
  /** Optional parent for nested regions (appendix inside main, etc.). */
  parentId?: string;
  notes?: string[];
};

export type RegionDiagnostics = {
  regionId: string;
  kind: DocumentRegionKind;
  itemCount: number;
  objectCount: number;
  coverageRatio: number;
  readingOrderConfidence: RegionConfidence;
  selectionCoverage: number;
  missingHints: string[];
};

export type DocumentRegionGraph = {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  regions: DocumentRegion[];
  /** Ordered region ids for document-level reading (main first, then appendix…). */
  readingRegionOrder: string[];
  diagnostics: RegionDiagnostics[];
  capabilities: RegionCapability[];
};

export type RegionCapability = {
  id: string;
  labelVi: string;
  present: boolean;
  regionKinds: DocumentRegionKind[];
  moduleId?: string;
  /** Optional DOI object count supporting this capability. */
  objectCount?: number;
  /** True when DOI independently confirmed presence. */
  doiConfirmed?: boolean;
};

export type RegionDetectorContext = {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  items: TextItemGeom[];
  lines: TextLine[];
  /** Regions already produced (mutable accumulation). */
  regions: DocumentRegion[];
  claimedItemIds: Set<string>;
};

export type RegionDetectorPlugin = {
  id: string;
  /** Primary kind this detector asserts. */
  regionKind: DocumentRegionKind;
  labelVi: string;
  priority: number;
  detect: (ctx: RegionDetectorContext) => DocumentRegion[];
};

export const REGION_LABELS_VI: Record<DocumentRegionKind, string> = {
  header: 'Đầu trang',
  main: 'Nội dung chính',
  footer: 'Cuối trang',
  margin: 'Lề / chú thích biên',
  metadata: 'Metadata',
  attachment: 'Đính kèm',
  appendix: 'Phụ lục',
  unknown: 'Chưa phân loại',
};
