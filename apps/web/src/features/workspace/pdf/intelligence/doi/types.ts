/**
 * EVO-002 — Document Object Intelligence (DOI) types.
 * Explainable · Rule-based · No OCR/AI · Raw immutable.
 */

import type { DocumentPrimitivePage } from '../dpl/types';

export type ObjectClass =
  | 'body-text'
  | 'heading'
  | 'title'
  | 'subtitle'
  | 'logo'
  | 'seal'
  | 'signature'
  | 'digital-signature'
  | 'watermark'
  | 'qr-code'
  | 'barcode'
  | 'stamp'
  | 'table'
  | 'table-border'
  | 'chart'
  | 'diagram'
  | 'photo'
  | 'icon'
  | 'footnote'
  | 'header'
  | 'footer'
  | 'margin-note'
  | 'annotation'
  | 'attachment'
  | 'appendix'
  | 'unknown';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type DetectorEvidence = {
  detectorId: string;
  detectorVersion: string;
  classHint: ObjectClass;
  score: number; // 0..1
  reasons: string[];
};

export type ObjectFeatures = {
  geometry: {
    x: number;
    y: number;
    w: number;
    h: number;
    cx: number;
    cy: number;
    area: number;
    aspect: number;
  };
  visual: {
    opacity: number;
    rotationDeg: number;
    colorRgb?: { r: number; g: number; b: number };
    isReddish: boolean;
    isLowOpacity: boolean;
  };
  typography: {
    fontSize?: number;
    fontWeight?: string;
    charCount: number;
    hasText: boolean;
  };
  position: {
    topBand: boolean;
    bottomBand: boolean;
    centerish: boolean;
    pageWidth: number;
    pageHeight: number;
  };
  source: {
    primitiveId: string;
    primitiveKind: string;
    textItemId?: string;
  };
};

export type ClassifiedObject = {
  id: string;
  pageNumber: number;
  class: ObjectClass;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  reasons: string[];
  evidence: DetectorEvidence[];
  features: ObjectFeatures;
  primitiveIds: string[];
  textItemIds: string[];
  text?: string;
  regionHint?: 'header' | 'main' | 'footer' | 'margin' | 'appendix' | 'attachment' | 'unknown';
  bbox: { x: number; y: number; w: number; h: number };
};

export type ObjectRelation = {
  id: string;
  type: 'belongs-to' | 'near' | 'contains' | 'repeats' | 'above' | 'below';
  fromId: string;
  toId: string;
  reasons: string[];
};

export type ObjectDiagnostics = {
  totalPrimitives: number;
  totalObjects: number;
  recognizedObjects: number;
  unknownObjects: number;
  objectCoverage: number;
  byClass: Partial<Record<ObjectClass, number>>;
  detectorCount: number;
  notes: string[];
};

export type ObjectCapability = {
  id: string;
  labelVi: string;
  present: boolean;
  objectClass?: ObjectClass;
};

export type DocumentObjectGraph = {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  fingerprint: string;
  primitives: DocumentPrimitivePage;
  objects: ClassifiedObject[];
  relations: ObjectRelation[];
  diagnostics: ObjectDiagnostics;
  capabilities: ObjectCapability[];
  engineVersion: string;
};

export type DoiDetector = {
  id: string;
  version: string;
  labelVi: string;
  detect: (ctx: DoiDetectorContext) => DetectorEvidence[];
};

export type DoiDetectorContext = {
  page: DocumentPrimitivePage;
  features: ObjectFeatures[];
};
