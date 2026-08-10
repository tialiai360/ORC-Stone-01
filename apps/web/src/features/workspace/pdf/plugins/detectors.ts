import {
  detectFooterAndSignatureRegions,
  detectHeaderRegions,
} from '../detect-header-footer';
import { detectLayoutKind, detectTableRegions } from '../detect-layout';
import { detectWatermarkRegions } from '../detect-watermark';
import { boundsOf } from '../geometry';
import type { StructureRegion } from '../types';
import type { DetectorContext, DetectorResult, StructureDetectorPlugin } from './types';

function claim(ctx: DetectorContext, itemIds: string[]) {
  itemIds.forEach((id) => ctx.claimedItemIds.add(id));
}

function withModule(
  regions: StructureRegion[],
  moduleId: StructureRegion['moduleId'],
): StructureRegion[] {
  return regions.map((r) => ({ ...r, moduleId: moduleId ?? r.moduleId }));
}

export function createHeaderPlugin(): StructureDetectorPlugin {
  return {
    id: 'HeaderDetector',
    moduleId: 'header',
    labelVi: 'Header',
    priority: 10,
    detect: (ctx) => {
      const regions = withModule(
        detectHeaderRegions(ctx.lines, ctx.items, ctx.pageWidth, ctx.pageHeight),
        'header',
      );
      claim(ctx, regions.flatMap((r) => r.itemIds));
      return { moduleId: 'header', regions };
    },
  };
}

export function createFooterPlugin(): StructureDetectorPlugin {
  return {
    id: 'FooterDetector',
    moduleId: 'footer',
    labelVi: 'Footer',
    priority: 20,
    detect: (ctx) => {
      const all = detectFooterAndSignatureRegions(ctx.lines, ctx.pageWidth, ctx.pageHeight);
      const regions = withModule(
        all.filter((r) => r.kind === 'footer'),
        'footer',
      );
      claim(ctx, regions.flatMap((r) => r.itemIds));
      return { moduleId: 'footer', regions };
    },
  };
}

export function createSignaturePlugin(): StructureDetectorPlugin {
  return {
    id: 'SignatureDetector',
    moduleId: 'signature',
    labelVi: 'Chữ ký',
    priority: 25,
    detect: (ctx) => {
      const all = detectFooterAndSignatureRegions(ctx.lines, ctx.pageWidth, ctx.pageHeight);
      const regions = withModule(
        all.filter((r) => r.kind === 'signature'),
        'signature',
      );
      const digital = regions.some((r) => /chữ\s*ký\s*số|digital\s*signature/i.test(r.text));
      const stamp = regions.some((r) => /dấu|stamp|con\s*dấu/i.test(r.text));
      claim(ctx, regions.flatMap((r) => r.itemIds));
      return {
        moduleId: 'signature',
        regions,
        flags: {
          ...(digital ? { 'digital-signature': true } : {}),
          ...(stamp ? { stamp: true } : {}),
        },
      };
    },
  };
}

export function createWatermarkPlugin(): StructureDetectorPlugin {
  return {
    id: 'WatermarkDetector',
    moduleId: 'watermark',
    labelVi: 'Watermark',
    priority: 30,
    detect: (ctx) => {
      const regions = withModule(
        detectWatermarkRegions(ctx.items, ctx.lines, ctx.pageWidth, ctx.pageHeight),
        'watermark',
      );
      claim(ctx, regions.flatMap((r) => r.itemIds));
      return { moduleId: 'watermark', regions };
    },
  };
}

export function createTablePlugin(): StructureDetectorPlugin {
  return {
    id: 'TableDetector',
    moduleId: 'table',
    labelVi: 'Bảng',
    priority: 40,
    detect: (ctx) => {
      const regions = withModule(
        detectTableRegions(ctx.lines, ctx.pageWidth, ctx.pageHeight, ctx.claimedItemIds),
        'table',
      );
      claim(ctx, regions.flatMap((r) => r.itemIds));
      return { moduleId: 'table', regions };
    },
  };
}

export function createPageNumberPlugin(): StructureDetectorPlugin {
  return {
    id: 'PageNumberDetector',
    moduleId: 'page-number',
    labelVi: 'Số trang',
    priority: 50,
    detect: (ctx) => {
      const re = /^(trang\s*)?\d+\s*[\/\-]\s*\d+$/i;
      const hits = ctx.lines.filter(
        (l) =>
          !l.items.every((i) => ctx.claimedItemIds.has(i.id)) &&
          (re.test(l.text.trim()) || /trang\s*\d+/i.test(l.text)),
      );
      if (hits.length === 0) {
        return { moduleId: 'page-number', regions: [] };
      }
      const itemIds = hits.flatMap((l) => l.items.map((i) => i.id));
      claim(ctx, itemIds);
      return {
        moduleId: 'page-number',
        regions: [
          {
            id: `region-page-number-${ctx.pageNumber}`,
            kind: 'footer',
            label: 'Page Number',
            text: hits.map((h) => h.text).join(' '),
            itemIds,
            excludeFromReadingOrder: true,
            selectable: true,
            moduleId: 'page-number',
            ...boundsOf(hits),
          },
        ],
      };
    },
  };
}

export function createQrBarcodePlugin(): StructureDetectorPlugin {
  return {
    id: 'QRCodeDetector',
    moduleId: 'qr-code',
    labelVi: 'QR Code',
    priority: 55,
    detect: (ctx) => {
      const qr = ctx.lines.filter((l) => /qr\s*code|mã\s*qr|\bqr\b/i.test(l.text));
      const barcode = ctx.lines.filter((l) => /barcode|mã\s*vạch/i.test(l.text));
      const regions: StructureRegion[] = [];
      if (qr.length > 0) {
        const itemIds = qr.flatMap((l) => l.items.map((i) => i.id));
        claim(ctx, itemIds);
        regions.push({
          id: `region-qr-${ctx.pageNumber}`,
          kind: 'stamp',
          label: 'QR Code',
          text: qr.map((l) => l.text).join(' '),
          itemIds,
          excludeFromReadingOrder: true,
          selectable: true,
          moduleId: 'qr-code',
          ...boundsOf(qr),
        });
      }
      return {
        moduleId: 'qr-code',
        regions,
        flags: barcode.length > 0 ? { barcode: true } : undefined,
      };
    },
  };
}

export function createLogoPlugin(): StructureDetectorPlugin {
  return {
    id: 'LogoDetector',
    moduleId: 'logo',
    labelVi: 'Logo',
    priority: 15,
    detect: (ctx) => {
      const hits = ctx.lines.filter(
        (l) =>
          l.y < ctx.pageHeight * 0.15 &&
          (/logo|biểu\s*tượng/i.test(l.text) ||
            (l.x < ctx.pageWidth * 0.2 && l.text.length <= 24 && l.w < ctx.pageWidth * 0.25)),
      );
      if (hits.length === 0) {
        return { moduleId: 'logo', regions: [] };
      }
      const itemIds = hits.flatMap((l) => l.items.map((i) => i.id));
      return {
        moduleId: 'logo',
        regions: [
          {
            id: `region-logo-${ctx.pageNumber}`,
            kind: 'header',
            label: 'Logo',
            text: hits.map((h) => h.text).join(' '),
            itemIds,
            excludeFromReadingOrder: true,
            selectable: true,
            moduleId: 'logo',
            ...boundsOf(hits),
          },
        ],
      };
    },
  };
}

export function createFootnotePlugin(): StructureDetectorPlugin {
  return {
    id: 'FootnoteDetector',
    moduleId: 'footnote',
    labelVi: 'Chú thích',
    priority: 60,
    detect: (ctx) => {
      const hits = ctx.lines.filter(
        (l) =>
          l.y > ctx.pageHeight * 0.85 &&
          (/^(\*+|\[\d+\]|\d+\))\s/.test(l.text.trim()) || /chú\s*thích/i.test(l.text)),
      );
      if (hits.length === 0) {
        return { moduleId: 'footnote', regions: [] };
      }
      const itemIds = hits.flatMap((l) => l.items.map((i) => i.id));
      claim(ctx, itemIds);
      return {
        moduleId: 'footnote',
        regions: [
          {
            id: `region-footnote-${ctx.pageNumber}`,
            kind: 'footer',
            label: 'Footnote',
            text: hits.map((h) => h.text).join(' '),
            itemIds,
            excludeFromReadingOrder: true,
            selectable: true,
            moduleId: 'footnote',
            ...boundsOf(hits),
          },
        ],
      };
    },
  };
}

export function createAnnexPlugin(): StructureDetectorPlugin {
  return {
    id: 'AnnexDetector',
    moduleId: 'annex',
    labelVi: 'Phụ lục',
    priority: 70,
    detect: (ctx) => {
      const hits = ctx.lines.filter((l) =>
        /^(phụ\s*lục|annex|appendix|đính\s*kèm|attachment)\b/i.test(l.text.trim()),
      );
      if (hits.length === 0) {
        return { moduleId: 'annex', regions: [] };
      }
      const itemIds = hits.flatMap((l) => l.items.map((i) => i.id));
      const isAttach = hits.some((h) => /đính\s*kèm|attachment/i.test(h.text));
      return {
        moduleId: 'annex',
        regions: [
          {
            id: `region-annex-${ctx.pageNumber}`,
            kind: 'header',
            label: isAttach ? 'Attachment' : 'Annex',
            text: hits.map((h) => h.text).join(' '),
            itemIds,
            excludeFromReadingOrder: false,
            selectable: true,
            moduleId: isAttach ? 'attachment' : 'annex',
            ...boundsOf(hits),
          },
        ],
        flags: isAttach ? { attachment: true, annex: true } : { annex: true },
      };
    },
  };
}

export function createPageFlagsPlugin(): StructureDetectorPlugin {
  return {
    id: 'PageFlagsDetector',
    moduleId: 'selectable-text-layer',
    labelVi: 'Text layer',
    priority: 90,
    detect: (ctx): DetectorResult => {
      const visible = ctx.items.filter((i) => !i.flags?.invisible);
      const chars = visible.reduce((n, i) => n + i.text.replace(/\s+/g, '').length, 0);
      const rotatedItems = ctx.items.filter((i) => Math.abs(i.rotationDeg ?? 0) > 15);
      const invisible = ctx.items.filter((i) => i.flags?.invisible).length;
      const empty = chars < 3;
      const layout = detectLayoutKind(ctx.lines, ctx.pageWidth, []);

      const regions: StructureRegion[] = [];
      if (rotatedItems.length > 0) {
        const itemIds = rotatedItems.map((i) => i.id);
        claim(ctx, itemIds);
        const xs = rotatedItems.map((i) => i.x);
        const ys = rotatedItems.map((i) => i.y);
        const x2 = rotatedItems.map((i) => i.x + i.w);
        const y2 = rotatedItems.map((i) => i.y + i.h);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        regions.push({
          id: `region-rotated-${ctx.pageNumber}`,
          kind: 'watermark',
          label: 'Chữ xoay',
          text: rotatedItems
            .map((i) => i.text)
            .join(' ')
            .slice(0, 120),
          itemIds,
          excludeFromReadingOrder: false,
          selectable: true,
          moduleId: 'rotated-text',
          x,
          y,
          w: Math.max(...x2) - x,
          h: Math.max(...y2) - y,
        });
      }

      return {
        moduleId: 'selectable-text-layer',
        regions,
        flags: {
          'selectable-text-layer': chars >= 3,
          'invisible-text-layer': invisible > 0,
          'rotated-text': rotatedItems.length > 0,
          'empty-page': empty,
          'scanned-page': empty,
          'multi-column': layout === 'multi-column' || layout === 'sidebar',
          sidebar: layout === 'sidebar',
        },
      };
    },
  };
}
