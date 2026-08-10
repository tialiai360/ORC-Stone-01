/**
 * Viewer-facing types for PdfViewer (kept out of the fat component file).
 */

import type { StructureRegion } from './types';
import type { PageDiagnostics } from './types';

export type HighlightMark = {
  id: string;
  text: string;
  color: string;
  pageNumber: number;
  nodeId: string;
  flash?: boolean;
};

/** Lightweight DOI object for UI (page-relative % bbox). */
export type ObjectInsight = {
  id: string;
  pageNumber: number;
  class: string;
  confidence: string;
  confidenceScore: number;
  regionHint?: string;
  textPreview?: string;
  reasons: string[];
  /** Percent of page box — survives zoom remount. */
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PageStructureSnapshot = {
  pageNumber: number;
  regions: StructureRegion[];
  flags: Record<string, boolean>;
  headerText?: string;
  footerText?: string;
  diagnostics?: PageDiagnostics;
  /** Page size in PDF units — enables Recognition Map % for regions. */
  pageWidth?: number;
  pageHeight?: number;
  /** EVO-001F aggregated capabilities for this page. */
  capabilities?: import('./region-engine/types').RegionCapability[];
  /** EVO-002 DOI insights for Object panel / overlays. */
  objects?: ObjectInsight[];
};

/** Ask PdfViewer to jump + zoom so a region fills the Evidence viewport. */
export type FocusRegionRequest = {
  pageNumber: number;
  x: number;
  y: number;
  w: number;
  h: number;
  pageWidth: number;
  pageHeight: number;
  /** Bump to re-run fit for the same box. */
  nonce: number;
};

export type PdfSelectionPayload = {
  text: string;
  pageNumber: number;
  structureRef?: import('@orc/shared').AssignmentStructureRef;
};

export type PdfSelectionBridge = {
  /** Capture current DOM selection via structure engine (not raw toString). */
  capture: () => PdfSelectionPayload | null;
};
