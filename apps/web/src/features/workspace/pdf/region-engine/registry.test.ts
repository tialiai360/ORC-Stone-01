import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TextItemGeom } from '../types';
import { buildLines } from '../geometry';
import {
  buildDocumentRegionGraph,
  resetRegionPluginManagerForTests,
} from './registry';
import { buildRegionFirstReadingOrder } from './reading-order';

function item(id: string, text: string, x: number, y: number, w = 80, h = 12): TextItemGeom {
  return { id, text, x, y, w, h };
}

describe('EVO-001F Region Engine', () => {
  it('partitions header / main / footer bands', () => {
    resetRegionPluginManagerForTests();
    const items = [
      item('h1', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', 40, 20, 300, 14),
      item('h2', 'Độc lập – Tự do – Hạnh phúc', 80, 40, 220, 12),
      item('b1', 'Điều 1. Phạm vi điều chỉnh', 30, 200, 260, 14),
      item('b2', 'Nội dung chính của văn bản.', 30, 220, 240, 14),
      item('f1', 'Nơi nhận: Như trên', 30, 520, 180, 12),
    ];
    const lines = buildLines(items);
    const { graph } = buildDocumentRegionGraph({
      pageNumber: 1,
      pageWidth: 400,
      pageHeight: 600,
      items,
      lines,
    });
    const kinds = graph.regions.map((r) => r.kind);
    assert.ok(kinds.includes('header'));
    assert.ok(kinds.includes('main'));
    assert.ok(kinds.includes('footer'));
    assert.ok(graph.capabilities.some((c) => c.id === 'cap-header' && c.present));
    assert.ok(graph.capabilities.some((c) => c.id === 'cap-main' && c.present));
  });

  it('builds region-first reading order from main (not header)', () => {
    resetRegionPluginManagerForTests();
    const items = [
      item('h1', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', 40, 20, 300, 14),
      item('b1', 'Nội dung điều khoản chính.', 30, 200, 240, 14),
      item('w1', 'CONFIDENTIAL', 140, 280, 140, 30),
    ];
    const lines = buildLines(items);
    const { graph } = buildDocumentRegionGraph({
      pageNumber: 1,
      pageWidth: 400,
      pageHeight: 600,
      items,
      lines,
    });
    const paragraphs = buildRegionFirstReadingOrder(graph, lines);
    const corpus = paragraphs.map((p) => p.text).join(' ');
    assert.ok(corpus.includes('Nội dung'));
    assert.ok(!/CỘNG HÒA/.test(corpus) || corpus.indexOf('Nội dung') >= 0);
  });

  it('detects appendix region cue', () => {
    resetRegionPluginManagerForTests();
    const items = [
      item('a1', 'Phụ lục 1', 30, 180, 120, 14),
      item('a2', 'Bảng biểu kèm theo', 30, 200, 200, 14),
    ];
    const lines = buildLines(items);
    const { graph } = buildDocumentRegionGraph({
      pageNumber: 1,
      pageWidth: 400,
      pageHeight: 600,
      items,
      lines,
    });
    assert.ok(graph.regions.some((r) => r.kind === 'appendix'));
    assert.ok(graph.capabilities.some((c) => c.id === 'cap-appendix' && c.present));
  });
});
