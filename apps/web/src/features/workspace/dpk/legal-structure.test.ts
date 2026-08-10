import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyLegalLine, detectLegalStructure } from './legal-structure';
import { bridgeForStoneModule } from './module-map';
import type { DetectorContext } from '../pdf/plugins/types';
import type { TextItemGeom, TextLine } from '../pdf/types';

describe('DPK legal structure', () => {
  it('classifies Điều / Khoản / Điểm / Trích yếu / Căn cứ', () => {
    assert.equal(classifyLegalLine('Điều 1. Phạm vi'), 'article');
    assert.equal(classifyLegalLine('1. Nội dung khoản'), 'clause');
    assert.equal(classifyLegalLine('a) Điểm chi tiết'), 'point');
    assert.equal(classifyLegalLine('V/v triển khai quy trình'), 'subject');
    assert.equal(classifyLegalLine('Căn cứ Luật các tổ chức tín dụng'), 'legal-basis');
  });

  it('detects regions without claiming body out of RO', () => {
    const line = (id: string, text: string, y: number): TextLine => {
      const item: TextItemGeom = { id, text, x: 20, y, w: 200, h: 14 };
      return { id: `l-${id}`, text, x: 20, y, w: 200, h: 14, items: [item] };
    };
    const ctx: DetectorContext = {
      pageNumber: 1,
      pageWidth: 400,
      pageHeight: 600,
      items: [],
      lines: [
        line('s1', 'V/v ban hành quy chế', 80),
        line('a1', 'Điều 2. Giải thích từ ngữ', 200),
        line('c1', '1. Trong quy chế này', 230),
      ],
      claimedItemIds: new Set(),
    };
    const result = detectLegalStructure(ctx);
    const ids = result.regions.map((r) => r.moduleId);
    assert.ok(ids.includes('subject'));
    assert.ok(ids.includes('article'));
    assert.ok(ids.includes('clause'));
    assert.equal(ctx.claimedItemIds.size, 0);
  });
});

describe('DPK module map', () => {
  it('maps watermark to MOD-WATERMARK', () => {
    const b = bridgeForStoneModule('watermark');
    assert.equal(b?.dpkModule, 'MOD-WATERMARK');
    assert.equal(b?.excludesFromReadingOrder, true);
  });

  it('maps article to MOD-LEGAL / Article', () => {
    const b = bridgeForStoneModule('article');
    assert.equal(b?.dpkModule, 'MOD-LEGAL');
    assert.equal(b?.dpkClass, 'Article');
  });
});
