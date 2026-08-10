/**
 * Structure Module plugin contracts — Interaction / Presentation Layer only.
 * Detectors never mutate raw PDF bytes.
 */

import type { StructureRegion, TextItemGeom, TextLine } from '../types';

/** Canonical module ids (only detected ones are shown in UI). */
export type StructureModuleId =
  | 'header'
  | 'footer'
  | 'watermark'
  | 'logo'
  | 'stamp'
  | 'signature'
  | 'digital-signature'
  | 'qr-code'
  | 'barcode'
  | 'table'
  | 'image'
  | 'sidebar'
  | 'footnote'
  | 'multi-column'
  | 'page-number'
  | 'repeated-header'
  | 'repeated-footer'
  | 'attachment'
  | 'annex'
  | 'empty-page'
  | 'scanned-page'
  | 'selectable-text-layer'
  | 'invisible-text-layer'
  | 'rotated-text'
  | 'annotation-layer'
  | 'subject'
  | 'legal-basis'
  | 'article'
  | 'clause'
  | 'point';

export type ModuleVisualState = {
  visible: boolean;
  highlight: boolean;
  focus: boolean;
};

export type WorkspaceViewMode = 'normal' | 'authoring' | 'review' | 'reading' | 'focus';

export type DetectorContext = {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  items: TextItemGeom[];
  lines: TextLine[];
  /** Item ids already claimed by earlier plugins. */
  claimedItemIds: Set<string>;
};

export type DetectorResult = {
  moduleId: StructureModuleId;
  regions: StructureRegion[];
  /** Page-level flags without a region box (e.g. empty-page). */
  flags?: Partial<Record<StructureModuleId, boolean>>;
};

export type StructureDetectorPlugin = {
  id: string;
  moduleId: StructureModuleId;
  labelVi: string;
  /** Lower runs first. */
  priority: number;
  detect: (ctx: DetectorContext) => DetectorResult;
};

export type DetectedModule = {
  moduleId: StructureModuleId;
  labelVi: string;
  pageNumbers: number[];
  regionCount: number;
  sampleText?: string;
  /** True when module has regions/itemIds — hide/highlight/isolate will affect PDF. */
  actionable: boolean;
};

export const MODULE_LABELS_VI: Record<StructureModuleId, string> = {
  header: 'Đầu trang',
  footer: 'Cuối trang',
  watermark: 'Watermark',
  logo: 'Logo',
  stamp: 'Con dấu',
  signature: 'Chữ ký',
  'digital-signature': 'Chữ ký số',
  'qr-code': 'Mã QR',
  barcode: 'Mã vạch',
  table: 'Bảng',
  image: 'Hình ảnh',
  sidebar: 'Cột phụ',
  footnote: 'Chú thích cuối trang',
  'multi-column': 'Nhiều cột',
  'page-number': 'Số trang',
  'repeated-header': 'Đầu trang lặp',
  'repeated-footer': 'Cuối trang lặp',
  attachment: 'Đính kèm',
  annex: 'Phụ lục',
  'empty-page': 'Trang trống',
  'scanned-page': 'Trang scan',
  'selectable-text-layer': 'Lớp chữ chọn được',
  'invisible-text-layer': 'Lớp chữ ẩn/lệch',
  'rotated-text': 'Chữ xoay',
  'annotation-layer': 'Lớp chú thích PDF',
  subject: 'Trích yếu',
  'legal-basis': 'Căn cứ',
  article: 'Điều',
  clause: 'Khoản',
  point: 'Điểm',
};
