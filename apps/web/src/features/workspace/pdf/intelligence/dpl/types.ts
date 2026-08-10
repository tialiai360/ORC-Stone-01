/**
 * Document Primitive Layer (DPL) — format-agnostic visible primitives.
 * Raw document bytes never mutated. Provider-agnostic (see intelligence/input).
 */

export type TextSourceKind = 'embedded-text' | 'derived-text' | 'unknown';

/** Provenance on extracted text — technology-neutral. */
export type TextProvenance = {
  source: TextSourceKind;
  providerId: string;
  providerVersion: string;
  confidence: number;
  pageNumber: number;
  bbox?: { x: number; y: number; w: number; h: number };
  engine?: string;
};

export type PrimitiveKind =
  | 'glyph'
  | 'text'
  | 'vector'
  | 'path'
  | 'image'
  | 'shape'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'polygon'
  | 'curve'
  | 'annotation'
  | 'form'
  | 'embedded'
  | 'transparency-group'
  | 'clip'
  | 'pattern'
  | 'gradient'
  | 'mask'
  | 'layer'
  | 'metadata'
  | 'transform'
  | 'unknown';

export type RgbColor = { r: number; g: number; b: number };

export type DocumentPrimitive = {
  id: string;
  kind: PrimitiveKind;
  pageNumber: number;
  source: AdapterSource;
  bbox: { x: number; y: number; w: number; h: number };
  center: { x: number; y: number };
  rotationDeg: number;
  scale: number;
  opacity: number;
  zOrder: number;
  layerHint?: string;
  text?: string;
  unicode?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  colorRgb?: RgbColor;
  stroke?: boolean;
  fill?: boolean;
  /** Link back to text item id when sourced from embedded geom/DOM. */
  textItemId?: string;
  /** Explainable extraction note. */
  extractNotes?: string[];
  /** Required for text-bearing primitives produced via Input Runtime. */
  provenance?: TextProvenance;
};

export type AdapterSource = {
  adapterId: string;
  format: string;
  adapterVersion: string;
};

export type DocumentPrimitivePage = {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  primitives: DocumentPrimitive[];
  source: AdapterSource;
  /** Fingerprint for cache invalidation. */
  fingerprint: string;
};
