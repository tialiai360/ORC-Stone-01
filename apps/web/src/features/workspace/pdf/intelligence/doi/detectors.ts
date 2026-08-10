/**
 * Multi-detector registry — independent, versioned, explainable rules.
 */

import type { DetectorEvidence, DoiDetector, DoiDetectorContext, ObjectClass } from './types';

function ev(
  detector: DoiDetector,
  classHint: ObjectClass,
  score: number,
  reasons: string[],
  primitiveIndex?: number,
): DetectorEvidence & { primitiveIndex?: number } {
  return {
    detectorId: detector.id,
    detectorVersion: detector.version,
    classHint,
    score: Math.min(1, Math.max(0, score)),
    reasons,
    primitiveIndex,
  };
}

function makeSimpleDetector(
  id: string,
  labelVi: string,
  fn: (ctx: DoiDetectorContext, self: DoiDetector) => DetectorEvidence[],
): DoiDetector {
  const self: DoiDetector = {
    id,
    version: '1.0.0',
    labelVi,
    detect: (ctx) => fn(ctx, self),
  };
  return self;
}

export function createTextDetector(): DoiDetector {
  return makeSimpleDetector('det.text.v1', 'Text', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    ctx.features.forEach((f, i) => {
      if (!f.typography.hasText) {
        return;
      }
      if (f.typography.charCount >= 2 && !f.visual.isLowOpacity) {
        out.push(
          ev(
            self,
            'body-text',
            0.55 + Math.min(0.35, f.typography.charCount / 80),
            ['has-text', `chars:${f.typography.charCount}`],
            i,
          ),
        );
      }
    });
    return out;
  });
}

export function createHeadingDetector(): DoiDetector {
  return makeSimpleDetector('det.heading.v1', 'Heading', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    const sizes = ctx.features
      .map((f) => f.typography.fontSize)
      .filter((n): n is number => typeof n === 'number' && n > 0);
    const median =
      sizes.length === 0
        ? 12
        : [...sizes].sort((a, b) => a - b)[Math.floor(sizes.length / 2)]!;
    ctx.features.forEach((f, i) => {
      if (!f.typography.hasText) {
        return;
      }
      const fs = f.typography.fontSize ?? 0;
      const bold = Number(f.typography.fontWeight) >= 600 || f.typography.fontWeight === 'bold';
      const text = ctx.page.primitives[i]?.text ?? '';
      if (/^(điều|khoản|mục|chương)\s+/i.test(text.trim()) || (fs >= median * 1.25 && bold)) {
        out.push(
          ev(self, 'heading', 0.75, ['cue:heading-or-larger-bold', `fontSize:${fs}`], i),
        );
      }
      if (/^(cộng hòa|quyết định|thông báo|công văn)/i.test(text.trim()) && f.position.topBand) {
        out.push(ev(self, 'title', 0.8, ['cue:national-or-doc-title', 'top-band'], i));
      }
    });
    return out;
  });
}

export function createWatermarkDetector(): DoiDetector {
  return makeSimpleDetector('det.watermark.v1', 'Watermark', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    ctx.features.forEach((f, i) => {
      const p = ctx.page.primitives[i];
      const notes = p?.extractNotes ?? [];
      const diagonal = Math.abs(f.visual.rotationDeg) >= 15;
      const large = f.geometry.area > ctx.page.pageWidth * ctx.page.pageHeight * 0.08;
      if (
        f.visual.isLowOpacity ||
        notes.includes('flag:watermark-hint') ||
        (diagonal && large && f.typography.hasText)
      ) {
        const reasons = [
          f.visual.isLowOpacity ? 'low-opacity' : '',
          diagonal ? 'rotated' : '',
          large ? 'large-area' : '',
          notes.includes('flag:watermark-hint') ? 'flag:watermark' : '',
        ].filter(Boolean);
        out.push(ev(self, 'watermark', 0.7, reasons, i));
      }
    });
    return out;
  });
}

export function createSealDetector(): DoiDetector {
  return makeSimpleDetector('det.seal.v1', 'Seal', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    ctx.features.forEach((f, i) => {
      const squareish = f.geometry.aspect > 0.7 && f.geometry.aspect < 1.4;
      const modest = f.geometry.w > 28 && f.geometry.w < ctx.page.pageWidth * 0.35;
      if (f.position.bottomBand && (f.visual.isReddish || squareish) && modest) {
        out.push(
          ev(
            self,
            'seal',
            f.visual.isReddish ? 0.72 : 0.55,
            [
              'bottom-band',
              f.visual.isReddish ? 'reddish' : 'squareish',
              `aspect:${f.geometry.aspect.toFixed(2)}`,
            ],
            i,
          ),
        );
      }
    });
    return out;
  });
}

export function createSignatureDetector(): DoiDetector {
  return makeSimpleDetector('det.signature.v1', 'Signature', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    ctx.features.forEach((f, i) => {
      const text = (ctx.page.primitives[i]?.text ?? '').toLowerCase();
      const cue =
        /ký|signature|giám đốc|trưởng phòng|duyệt/.test(text) ||
        (/^(tm\.|kt\.)/i.test(text) && f.position.bottomBand);
      if (f.position.bottomBand && (cue || (!f.typography.hasText && f.geometry.w > 40))) {
        out.push(
          ev(
            self,
            cue ? 'signature' : 'signature',
            cue ? 0.78 : 0.5,
            [f.position.bottomBand ? 'bottom-band' : '', cue ? 'cue:signer' : 'freeform-bottom'].filter(
              Boolean,
            ),
            i,
          ),
        );
      }
    });
    return out;
  });
}

function isRunningChromeText(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 72) {
    return false;
  }
  if (/^\d{1,4}(\s*\/\s*\d{1,4})?$/.test(t)) {
    return true;
  }
  if (/^(trang|page|p\.?)\s*\d+/i.test(t)) {
    return true;
  }
  if (/mật|confidential|nội bộ|draft|bản nháp/i.test(t) && t.length <= 48) {
    return true;
  }
  // Short running header/footer — not article body
  return t.length <= 48 && !/^(điều|khoản|mục|chương)\s+/i.test(t);
}

export function createHeaderFooterDetector(): DoiDetector {
  return makeSimpleDetector('det.header-footer.v1', 'Header/Footer', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    ctx.features.forEach((f, i) => {
      if (!f.typography.hasText) {
        return;
      }
      const text = ctx.page.primitives[i]?.text ?? '';
      if (!isRunningChromeText(text)) {
        return;
      }
      if (f.position.topBand) {
        out.push(ev(self, 'header', 0.68, ['top-band', 'running-chrome'], i));
      }
      if (f.position.bottomBand) {
        out.push(ev(self, 'footer', 0.66, ['bottom-band', 'running-chrome'], i));
      }
    });
    return out;
  });
}

export function createTableCueDetector(): DoiDetector {
  return makeSimpleDetector('det.table-cue.v1', 'Table', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    const lines = new Map<number, number>();
    for (const f of ctx.features) {
      if (!f.typography.hasText) {
        continue;
      }
      const bucket = Math.round(f.geometry.y / 8);
      lines.set(bucket, (lines.get(bucket) ?? 0) + 1);
    }
    const multi = [...lines.values()].filter((n) => n >= 3).length;
    if (multi >= 3) {
      // Attribute to first body-ish primitive as table cue carrier
      const idx = ctx.features.findIndex((f) => f.position.centerish && f.typography.hasText);
      if (idx >= 0) {
        out.push(ev(self, 'table', 0.62, [`aligned-rows:${multi}`, 'cue:table-grid'], idx));
      }
    }
    return out;
  });
}

export function createImageDetector(): DoiDetector {
  return makeSimpleDetector('det.image.v1', 'Image', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    ctx.page.primitives.forEach((p, i) => {
      if (p.kind === 'image') {
        const proxy = p.extractNotes?.includes('proxy:full-page-raster');
        out.push(
          ev(
            self,
            'photo',
            proxy ? 0.35 : 0.7,
            proxy ? ['page-canvas-proxy'] : ['primitive:image'],
            i,
          ),
        );
      }
    });
    return out;
  });
}

/** Geometric + lexical QR cues (no decode / no OCR). */
export function createQrCodeDetector(): DoiDetector {
  return makeSimpleDetector('det.qr.v1', 'QR Code', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    ctx.features.forEach((f, i) => {
      const p = ctx.page.primitives[i];
      const text = (p?.text ?? '').trim();
      const lexical = /qr\s*code|mã\s*qr|\bqr\b/i.test(text);
      const notes = p?.extractNotes ?? [];
      const squareAnnot = notes.includes('cue:square-annot');
      const squareish = f.geometry.aspect > 0.82 && f.geometry.aspect < 1.22;
      const modest =
        f.geometry.w >= 24 &&
        f.geometry.w <= ctx.page.pageWidth * 0.32 &&
        f.geometry.h >= 24 &&
        f.geometry.h <= ctx.page.pageHeight * 0.32;
      const cornerish =
        f.geometry.x < ctx.page.pageWidth * 0.22 ||
        f.geometry.x + f.geometry.w > ctx.page.pageWidth * 0.78 ||
        f.geometry.y < ctx.page.pageHeight * 0.22 ||
        f.geometry.y + f.geometry.h > ctx.page.pageHeight * 0.78;
      const imageLike =
        p?.kind === 'image' ||
        p?.kind === 'rectangle' ||
        p?.kind === 'annotation' ||
        (!f.typography.hasText && p?.kind !== 'text' && p?.kind !== 'glyph');
      const proxy = notes.includes('proxy:full-page-raster');
      if (proxy) {
        return;
      }
      if (lexical) {
        out.push(ev(self, 'qr-code', 0.82, ['cue:lexical-qr'], i));
        return;
      }
      if ((squareAnnot || (squareish && modest && imageLike)) && (cornerish || squareAnnot)) {
        out.push(
          ev(
            self,
            'qr-code',
            squareAnnot ? 0.7 : 0.58,
            [
              squareish ? 'squareish' : '',
              modest ? 'modest-size' : '',
              cornerish ? 'corner-band' : '',
              squareAnnot ? 'square-annot' : '',
            ].filter(Boolean),
            i,
          ),
        );
      }
    });
    return out;
  });
}

/** Geometric + lexical barcode cues (no decode). */
export function createBarcodeDetector(): DoiDetector {
  return makeSimpleDetector('det.barcode.v1', 'Barcode', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    ctx.features.forEach((f, i) => {
      const p = ctx.page.primitives[i];
      const text = (p?.text ?? '').trim();
      const lexical = /barcode|mã\s*vạch|ean[\s-]?\d+/i.test(text);
      const wide = f.geometry.aspect >= 2.4;
      const short = f.geometry.h > 8 && f.geometry.h < ctx.page.pageHeight * 0.12;
      const modestW = f.geometry.w > 48 && f.geometry.w < ctx.page.pageWidth * 0.7;
      const proxy = p?.extractNotes?.includes('proxy:full-page-raster');
      if (proxy) {
        return;
      }
      if (lexical) {
        out.push(ev(self, 'barcode', 0.8, ['cue:lexical-barcode'], i));
        return;
      }
      if (wide && short && modestW && !f.typography.hasText) {
        out.push(
          ev(self, 'barcode', 0.56, ['wide-aspect', 'short-height', 'no-text'], i),
        );
      }
    });
    return out;
  });
}

/** Link / form annotations as annotation objects. */
export function createAnnotationDetector(): DoiDetector {
  return makeSimpleDetector('det.annotation.v1', 'Annotation', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    ctx.page.primitives.forEach((p, i) => {
      const notes = p.extractNotes ?? [];
      if (
        p.kind === 'annotation' ||
        p.kind === 'form' ||
        notes.includes('source:annotation-layer')
      ) {
        // Skip if already strong QR square — QR detector owns those
        if (notes.includes('cue:square-annot')) {
          return;
        }
        out.push(
          ev(
            self,
            'annotation',
            notes.includes('kind:link') ? 0.72 : 0.6,
            notes.filter((n) => n.startsWith('kind:') || n === 'source:annotation-layer'),
            i,
          ),
        );
      }
    });
    return out;
  });
}

export function createAppendixAttachmentDetector(): DoiDetector {
  return makeSimpleDetector('det.appendix-attachment.v1', 'Appendix/Attachment', (ctx, self) => {
    const out: DetectorEvidence[] = [];
    ctx.page.primitives.forEach((p, i) => {
      const text = (p.text ?? '').trim();
      if (/^(phụ\s*lục|annex|appendix)\b/i.test(text)) {
        out.push(ev(self, 'appendix', 0.85, ['cue:phu-luc'], i));
      }
      if (/^(đính\s*kèm|attachment)\b/i.test(text)) {
        out.push(ev(self, 'attachment', 0.85, ['cue:dinh-kem'], i));
      }
    });
    return out;
  });
}

export class DoiDetectorRegistry {
  private detectors: DoiDetector[] = [];

  register(d: DoiDetector): void {
    this.detectors = [...this.detectors.filter((x) => x.id !== d.id), d];
  }

  list(): DoiDetector[] {
    return [...this.detectors];
  }

  run(ctx: DoiDetectorContext): Array<DetectorEvidence & { primitiveIndex?: number }> {
    const all: Array<DetectorEvidence & { primitiveIndex?: number }> = [];
    for (const d of this.detectors) {
      for (const e of d.detect(ctx)) {
        all.push(e as DetectorEvidence & { primitiveIndex?: number });
      }
    }
    return all;
  }
}

let singleton: DoiDetectorRegistry | null = null;

export function getDefaultDoiDetectorRegistry(): DoiDetectorRegistry {
  if (singleton) {
    return singleton;
  }
  const reg = new DoiDetectorRegistry();
  [
    createTextDetector(),
    createHeadingDetector(),
    createWatermarkDetector(),
    createSealDetector(),
    createSignatureDetector(),
    createHeaderFooterDetector(),
    createTableCueDetector(),
    createImageDetector(),
    createQrCodeDetector(),
    createBarcodeDetector(),
    createAnnotationDetector(),
    createAppendixAttachmentDetector(),
  ].forEach((d) => reg.register(d));
  singleton = reg;
  return reg;
}

export function resetDoiDetectorRegistryForTests(): void {
  singleton = null;
}
