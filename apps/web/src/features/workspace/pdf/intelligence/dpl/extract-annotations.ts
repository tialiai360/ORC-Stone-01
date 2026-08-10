/**
 * Extract annotation / link / form primitives from react-pdf AnnotationLayer DOM.
 * Presentation-only · no OCR · raw PDF immutable.
 */

import type { AdapterSource, DocumentPrimitive } from './types';

function parsePercentStyle(el: HTMLElement, prop: 'left' | 'top' | 'width' | 'height'): number | null {
  const raw = el.style[prop];
  if (!raw) {
    return null;
  }
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Map annotation section boxes (CSS % of page) → page-space primitives.
 */
export function extractAnnotationPrimitives(args: {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  pageEl: HTMLElement | null | undefined;
  source: AdapterSource;
}): DocumentPrimitive[] {
  const { pageNumber, pageWidth, pageHeight, pageEl, source } = args;
  if (!pageEl || pageWidth <= 0 || pageHeight <= 0) {
    return [];
  }

  const layer = pageEl.querySelector<HTMLElement>(
    '.react-pdf__Page__annotations, .annotationLayer',
  );
  if (!layer) {
    return [];
  }

  const sections = layer.querySelectorAll<HTMLElement>('section, a, .linkAnnotation, .buttonWidgetAnnotation');
  const out: DocumentPrimitive[] = [];
  let idx = 0;

  sections.forEach((el) => {
    const leftPct = parsePercentStyle(el, 'left');
    const topPct = parsePercentStyle(el, 'top');
    const widthPct = parsePercentStyle(el, 'width');
    const heightPct = parsePercentStyle(el, 'height');

    let x: number;
    let y: number;
    let w: number;
    let h: number;

    if (
      leftPct != null &&
      topPct != null &&
      widthPct != null &&
      heightPct != null &&
      widthPct > 0 &&
      heightPct > 0
    ) {
      x = (leftPct / 100) * pageWidth;
      y = (topPct / 100) * pageHeight;
      w = (widthPct / 100) * pageWidth;
      h = (heightPct / 100) * pageHeight;
    } else {
      const pageRect = pageEl.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      if (pageRect.width < 1 || pageRect.height < 1 || rect.width < 2 || rect.height < 2) {
        return;
      }
      x = ((rect.left - pageRect.left) / pageRect.width) * pageWidth;
      y = ((rect.top - pageRect.top) / pageRect.height) * pageHeight;
      w = (rect.width / pageRect.width) * pageWidth;
      h = (rect.height / pageRect.height) * pageHeight;
    }

    if (w < 2 || h < 2) {
      return;
    }

    const href = el.getAttribute('href') ?? el.querySelector('a')?.getAttribute('href') ?? '';
    const title = el.getAttribute('title') ?? el.textContent?.trim() ?? '';
    const role = el.className || el.tagName.toLowerCase();
    const isLink = Boolean(href) || /linkAnnotation/i.test(role) || el.tagName === 'A';
    const isForm = /WidgetAnnotation|textWidget|buttonWidget|choiceWidget/i.test(role);
    const notes = ['source:annotation-layer'];
    if (isLink) {
      notes.push('kind:link');
    }
    if (isForm) {
      notes.push('kind:form');
    }
    if (href) {
      notes.push(`href:${href.slice(0, 120)}`);
    }

    const aspect = h > 0 ? w / h : 0;
    let kind: DocumentPrimitive['kind'] = 'annotation';
    if (isForm) {
      kind = 'form';
    } else if (aspect > 0.75 && aspect < 1.35 && w >= 28 && w <= pageWidth * 0.28) {
      // Square annotation — possible QR hotspot / stamp link
      kind = 'rectangle';
      notes.push('cue:square-annot');
    }

    out.push({
      id: `prim-${pageNumber}-ann-${idx}`,
      kind,
      pageNumber,
      source,
      bbox: { x, y, w, h },
      center: { x: x + w / 2, y: y + h / 2 },
      rotationDeg: 0,
      scale: 1,
      opacity: 1,
      zOrder: 10_000 + idx,
      text: title || undefined,
      extractNotes: notes,
    });
    idx += 1;
  });

  return out.slice(0, 80);
}
