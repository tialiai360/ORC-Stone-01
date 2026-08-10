/**
 * EVO-009 — Recognition UX layer (presentation only).
 * Does not alter DOI engine, region engine, Foundation, Knowledge, or Evidence.
 */

import type { ObjectInsight } from '../pdf/viewer-types';

export type CorrectionAction = 'reclass' | 'reject' | 'confirm';

/** Human correction of a detected document object (session + progressive store). */
export type ObjectCorrection = {
  /** Stable-enough key across re-analyze when id changes. */
  fingerprint: string;
  objectId: string;
  pageNumber: number;
  action: CorrectionAction;
  originalClass: string;
  /** Target class when action === 'reclass'. */
  class?: string;
  textPreview?: string;
  updatedAt: string;
};

/** Spatial cell for Recognition Map (page-relative %). */
export type RecognitionMapCell = {
  id: string;
  source: 'object' | 'region';
  label: string;
  pageNumber: number;
  left: number;
  top: number;
  width: number;
  height: number;
  objectClass?: string;
  moduleId?: string;
  confidenceScore?: number;
  corrected?: boolean;
  rejected?: boolean;
};

/** ObjectInsight + presentation correction overlays. */
export type DisplayObjectInsight = ObjectInsight & {
  displayClass: string;
  rejected: boolean;
  confirmed: boolean;
  corrected: boolean;
  originalClass: string;
};

export type RecognitionSummary = {
  pagesAnalyzed: number;
  objectCount: number;
  moduleCount: number;
  capabilityPresent: number;
  capabilityTotal: number;
  correctionCount: number;
  rejectedCount: number;
  lowConfidenceCount: number;
};
