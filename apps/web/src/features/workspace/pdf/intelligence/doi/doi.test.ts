import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clearDoiCache, resetDoiDetectorRegistryForTests, runDoiEngine } from './index';
import type { TextItemGeom } from '../../types';

function item(
  id: string,
  text: string,
  x: number,
  y: number,
  w = 80,
  h = 14,
  extra?: Partial<TextItemGeom>,
): TextItemGeom {
  return { id, text, x, y, w, h, ...extra };
}

describe('EVO-002 DOI Engine', () => {
  it('classifies title/header in top band and body text', () => {
    clearDoiCache();
    resetDoiDetectorRegistryForTests();
    const graph = runDoiEngine({
      pageNumber: 1,
      pageWidth: 600,
      pageHeight: 800,
      textItems: [
        item('t1', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', 40, 20, 400, 16),
        item('b1', 'Điều 1. Phạm vi điều chỉnh', 40, 200, 280, 14),
        item('b2', 'Nội dung văn bản hành chính.', 40, 220, 300, 14),
      ],
    });
    assert.ok(graph.objects.length >= 3);
    assert.ok(graph.diagnostics.totalPrimitives >= 3);
    assert.ok(graph.capabilities.some((c) => c.id === 'ocap-text' && c.present));
    const titleOrHeader = graph.objects.some(
      (o) => o.class === 'title' || o.class === 'header' || o.class === 'heading',
    );
    assert.equal(titleOrHeader, true);
    assert.ok(graph.objects.every((o) => o.reasons.length > 0 || o.class === 'unknown'));
  });

  it('flags low-opacity rotated text as watermark candidate', () => {
    clearDoiCache();
    resetDoiDetectorRegistryForTests();
    const graph = runDoiEngine({
      pageNumber: 1,
      pageWidth: 600,
      pageHeight: 800,
      textItems: [
        item('w1', 'BẢN NHÁP', 100, 300, 300, 40, {
          opacityHint: 0.2,
          rotationDeg: 35,
        }),
        item('b1', 'Nội dung chính của trang.', 40, 200, 260, 14),
      ],
    });
    assert.ok(graph.objects.some((o) => o.class === 'watermark'));
    assert.ok(graph.capabilities.some((c) => c.id === 'ocap-watermark' && c.present));
  });

  it('caches by fingerprint', () => {
    clearDoiCache();
    resetDoiDetectorRegistryForTests();
    const items = [item('a', 'Hello', 10, 10)];
    const a = runDoiEngine({
      pageNumber: 2,
      pageWidth: 400,
      pageHeight: 500,
      textItems: items,
    });
    const b = runDoiEngine({
      pageNumber: 2,
      pageWidth: 400,
      pageHeight: 500,
      textItems: items,
    });
    assert.equal(a, b);
  });

  it('detects lexical QR cue and does not mark long top body as header', () => {
    clearDoiCache();
    resetDoiDetectorRegistryForTests();
    const graph = runDoiEngine({
      pageNumber: 1,
      pageWidth: 600,
      pageHeight: 800,
      textItems: [
        item(
          'long',
          'Đây là đoạn văn bản dài ở đầu trang nhưng không phải running header của tài liệu hành chính.',
          40,
          30,
          500,
          14,
        ),
        item('qr', 'Mã QR tra cứu', 480, 700, 90, 14),
      ],
    });
    assert.ok(graph.objects.some((o) => o.class === 'qr-code'));
    assert.ok(graph.capabilities.some((c) => c.id === 'ocap-qr' && c.present));
    const longObj = graph.objects.find((o) => o.textItemIds.includes('long'));
    assert.ok(longObj);
    assert.notEqual(longObj!.class, 'header');
  });
});
