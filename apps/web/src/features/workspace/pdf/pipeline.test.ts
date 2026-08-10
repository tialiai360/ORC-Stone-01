import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runDocumentStructurePipeline } from './pipeline';
import type { TextItemGeom } from './types';
import { cleanFragmentedSelection } from './selection-engine';
import { joinLineItems, buildLines } from './geometry';

function item(
  id: string,
  text: string,
  x: number,
  y: number,
  w = 40,
  h = 12,
  extra?: Partial<TextItemGeom>,
): TextItemGeom {
  return { id, text, x, y, w, h, ...extra };
}

describe('Document Structure Pipeline', () => {
  it('excludes quốc hiệu header from body corpus', () => {
    const model = runDocumentStructurePipeline(
      [
        item('h1', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', 80, 10, 280, 14),
        item('h2', 'Độc lập - Tự do - Hạnh phúc', 120, 28, 200, 12),
        item('b1', 'Điều 1.', 20, 120, 60, 14),
        item('b2', 'Nội dung chính của thông báo.', 20, 140, 220, 14),
      ],
      400,
      600,
      1,
    );
    assert.ok(model.diagnostics.headers >= 1);
    assert.ok(!model.corpus.includes('CỘNG HÒA'));
    assert.match(model.corpus, /Điều 1/);
    assert.ok(model.regionGraph?.regions.some((r) => r.kind === 'header'));
    assert.ok(model.regions.some((r) => r.moduleId === 'header' || r.kind === 'header'));
  });

  it('excludes DRAFT watermark from reading order but keeps diagnostics', () => {
    const model = runDocumentStructurePipeline(
      [
        item('w1', 'DRAFT', 150, 250, 120, 40, { rotationDeg: 45, opacityHint: 0.3 }),
        item('b1', 'Nội dung công việc cần thực hiện ngay.', 20, 100, 260, 14),
      ],
      400,
      600,
      2,
    );
    assert.ok(model.diagnostics.watermarks >= 1);
    assert.ok(!model.corpus.toLowerCase().includes('draft'));
    assert.match(model.corpus, /Nội dung công việc/);
  });

  it('detects footer nơi nhận separately', () => {
    const model = runDocumentStructurePipeline(
      [
        item('b1', 'Nội dung thân bài văn bản hành chính.', 20, 100, 260, 14),
        item('f1', 'Nơi nhận:', 20, 540, 80, 12),
        item('f2', '- Như trên;', 20, 556, 100, 12),
        item('f3', 'Trang 1/2', 300, 570, 60, 10),
      ],
      400,
      600,
      3,
    );
    assert.ok(model.diagnostics.footers >= 1);
    assert.ok(!model.corpus.includes('Nơi nhận'));
  });

  it('detects table-like aligned gaps as table region', () => {
    const row = (y: number, id: string) => [
      item(`${id}a`, 'STT', 20, y, 30, 12),
      item(`${id}b`, 'Tên', 80, y, 40, 12),
      item(`${id}c`, 'SL', 200, y, 30, 12),
      item(`${id}d`, 'Ghi chú', 280, y, 50, 12),
    ];
    const model = runDocumentStructurePipeline(
      [...row(200, '1'), ...row(220, '2'), ...row(240, '3')],
      400,
      600,
      4,
    );
    assert.ok(model.diagnostics.tables >= 1);
    assert.ok(
      model.regions.some((r) => r.moduleId === 'table' || r.kind === 'table') ||
        model.regionGraph?.regions.some((r) => r.objects.some((o) => o.type === 'table')),
    );
  });

  it('reports diagnostics coverage fields', () => {
    const model = runDocumentStructurePipeline(
      [
        item('1', 'Đoạn văn bản đủ dài để chọn.', 20, 80, 200, 14),
        item('2', 'Đoạn thứ hai liên tiếp.', 20, 100, 180, 14),
      ],
      400,
      600,
      5,
    );
    assert.equal(model.diagnostics.pageNumber, 5);
    assert.ok(model.diagnostics.selectionBlocks >= 1);
    assert.ok(model.diagnostics.selectableCoverage >= 0);
    assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(model.diagnostics.readingOrderConfidence));
  });

  it('joins line gaps and cleans fragmented selection', () => {
    assert.equal(
      joinLineItems([
        item('a', 'Thông', 10, 20, 36, 12),
        item('b', 'báo', 52, 20, 28, 12),
      ]),
      'Thông báo',
    );
    assert.equal(buildLines([item('1', 'A', 10, 10), item('2', 'B', 10, 40)]).length, 2);
    assert.equal(cleanFragmentedSelection('hello\n\nworld'), 'hello world');
  });
});
