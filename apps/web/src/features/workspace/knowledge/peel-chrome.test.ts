import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectPeeledChrome, peeledToFieldSuggestions } from './peel-chrome';
import type { PageStructureSnapshot } from '../pdf/viewer-types';

describe('peel-chrome', () => {
  const snap: PageStructureSnapshot = {
    pageNumber: 1,
    flags: {},
    regions: [
      {
        id: 'w1',
        kind: 'watermark',
        label: 'WM',
        text: 'NỘI BỘ — BIDV',
        itemIds: ['a'],
        excludeFromReadingOrder: true,
        selectable: false,
        moduleId: 'watermark',
        x: 0,
        y: 0,
        w: 10,
        h: 10,
      },
      {
        id: 's1',
        kind: 'signature',
        label: 'Sig',
        text: 'Nguyễn Văn A',
        itemIds: ['b'],
        excludeFromReadingOrder: true,
        selectable: true,
        moduleId: 'signature',
        x: 0,
        y: 0,
        w: 10,
        h: 10,
      },
    ],
  };

  it('collects watermark and signature peels', () => {
    const peeled = collectPeeledChrome([snap]);
    assert.equal(peeled.length, 2);
    assert.ok(peeled.some((p) => p.kind === 'watermark' && p.saveToKnowledge));
    assert.ok(peeled.some((p) => p.kind === 'signature' && !p.saveToKnowledge));
  });

  it('only watermark becomes field suggestion', () => {
    const sug = peeledToFieldSuggestions(collectPeeledChrome([snap]), []);
    assert.equal(sug.length, 1);
    assert.equal(sug[0]?.nodeId, 'thong-tin-van-ban');
    assert.match(sug[0]?.text ?? '', /NỘI BỘ/);
  });
});
