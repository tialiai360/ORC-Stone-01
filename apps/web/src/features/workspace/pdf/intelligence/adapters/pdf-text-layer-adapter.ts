/**
 * @deprecated Use IInputProvider / getDefaultInputRuntime() (intelligence/input).
 * Thin bridge kept for call-sites not yet migrated.
 */

import { normalizePrimitivePage } from '../dpl/normalize';
import { getDefaultInputRuntime } from '../input/runtime';
import type { InputAdapter } from './types';

export const PDF_TEXT_LAYER_ADAPTER_ID = 'provider.pdf-text.v1';

export function createPdfTextLayerAdapter(): InputAdapter {
  return {
    id: PDF_TEXT_LAYER_ADAPTER_ID,
    format: 'pdf',
    version: '1.0.0',
    labelVi: 'Chữ nhúng PDF',
    extractPrimitives: (ctx) => {
      const page = getDefaultInputRuntime().extractDplPage({
        documentId: `legacy-adapter-${ctx.pageNumber}`,
        pageNumber: ctx.pageNumber,
        pageWidth: ctx.pageWidth,
        pageHeight: ctx.pageHeight,
        context: {
          textItems: ctx.textItems,
          pageEl: ctx.pageEl,
        },
      });
      return normalizePrimitivePage(page);
    },
  };
}
