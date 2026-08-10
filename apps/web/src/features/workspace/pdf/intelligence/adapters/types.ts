/**
 * @deprecated Prefer IInputProvider (intelligence/input).
 * Legacy adapter contract — bridges to Input Runtime.
 */

import type { DocumentPrimitivePage } from '../dpl/types';

export type AdapterFormat =
  | 'pdf'
  | 'docx'
  | 'odt'
  | 'html'
  | 'xml'
  | 'rtf'
  | 'eml'
  | 'msg'
  | 'tiff'
  | 'png'
  | 'jpeg'
  | 'svg'
  | 'future';

export type AdapterContext = {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  /** DOM page root when available (PDF TextLayer). */
  pageEl?: HTMLElement | null;
  /** Pre-collected text items (PDF path). */
  textItems?: import('../../types').TextItemGeom[];
};

export type InputAdapter = {
  id: string;
  format: AdapterFormat;
  version: string;
  labelVi: string;
  /** Sync extract for DOM/text-layer path; async reserved for future binaries. */
  extractPrimitives: (ctx: AdapterContext) => DocumentPrimitivePage;
};
