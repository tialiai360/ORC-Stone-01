import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildTableGrid,
  parseMarkdownTable,
  looksLikeMarkdownTable,
} from './table-grid';
import type { StructureRegion, TextLine } from '../pdf/types';

describe('table-grid', () => {
  it('builds markdown grid from cell gaps', () => {
    const region: StructureRegion = {
      id: 'region-table-0',
      kind: 'table',
      label: 'Table',
      text: 'a b c',
      itemIds: ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'],
      excludeFromReadingOrder: false,
      selectable: true,
      x: 0,
      y: 0,
      w: 300,
      h: 60,
    };
    const lines: TextLine[] = [
      {
        id: 'L1',
        text: 'STT Don vi Han',
        x: 0,
        y: 0,
        w: 300,
        h: 12,
        items: [
          { id: 'i1', text: 'STT', x: 0, y: 0, w: 40, h: 12 },
          { id: 'i2', text: 'Đơn vị', x: 80, y: 0, w: 50, h: 12 },
          { id: 'i3', text: 'Hạn', x: 200, y: 0, w: 40, h: 12 },
        ],
      },
      {
        id: 'L2',
        text: '1 CN A 30/06',
        x: 0,
        y: 20,
        w: 300,
        h: 12,
        items: [
          { id: 'i4', text: '1', x: 0, y: 20, w: 20, h: 12 },
          { id: 'i5', text: 'CN A', x: 80, y: 20, w: 40, h: 12 },
          { id: 'i6', text: '30/06', x: 200, y: 20, w: 40, h: 12 },
        ],
      },
    ];
    const grid = buildTableGrid(region, lines);
    assert.ok(grid);
    assert.equal(grid!.rowCount, 2);
    assert.equal(grid!.colCount, 3);
    assert.ok(looksLikeMarkdownTable(grid!.markdown));
    const parsed = parseMarkdownTable(grid!.markdown);
    assert.equal(parsed?.[0]?.[0], 'STT');
    assert.equal(parsed?.[1]?.[2], '30/06');
  });
});
