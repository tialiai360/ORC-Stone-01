import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deriveLayoutLayers,
  modulesHiddenByDispositions,
  hintsFromKeptLayers,
  seedLayerDispositions,
  dispositionStorageKey,
  type LayoutLayer,
} from './layout-layers';
import type { PageStructureSnapshot } from '../pdf/viewer-types';

function snap(partial: Partial<PageStructureSnapshot> & { pageNumber: number }): PageStructureSnapshot {
  return {
    regions: [],
    flags: {},
    ...partial,
  };
}

describe('layout-layers', () => {
  it('derives keep/discard defaults and knowledge hints', () => {
    const layers = deriveLayoutLayers([
      snap({
        pageNumber: 1,
        regions: [
          {
            id: 'r-wm',
            kind: 'watermark',
            label: 'WM',
            text: 'BIDV CONFIDENTIAL',
            itemIds: [],
            excludeFromReadingOrder: true,
            selectable: false,
            moduleId: 'watermark',
            x: 0,
            y: 0,
            w: 100,
            h: 100,
          },
          {
            id: 'r-body',
            kind: 'single-column',
            label: 'Body',
            text: 'Về việc: Tăng cường BCP\nSố: 21955/BIDV-QLRRHD\nNội dung hướng dẫn các đơn vị.',
            itemIds: [],
            excludeFromReadingOrder: false,
            selectable: true,
            moduleId: 'article',
            x: 0,
            y: 100,
            w: 200,
            h: 200,
          },
          {
            id: 'r-cc',
            kind: 'single-column',
            label: 'CC',
            text: 'Căn cứ Luật Các tổ chức tín dụng;\nCăn cứ Quyết định 01/QĐ-HĐQT;',
            itemIds: [],
            excludeFromReadingOrder: false,
            selectable: true,
            moduleId: 'legal-basis',
            x: 0,
            y: 300,
            w: 200,
            h: 80,
          },
          {
            id: 'r-sig',
            kind: 'signature',
            label: 'Sig',
            text: 'KT. GIÁM ĐỐC\nNguyễn Văn A',
            itemIds: [],
            excludeFromReadingOrder: true,
            selectable: true,
            moduleId: 'signature',
            x: 0,
            y: 400,
            w: 100,
            h: 60,
          },
          {
            id: 'r-ft',
            kind: 'footer',
            label: 'FT',
            text: 'Trang 1/3',
            itemIds: [],
            excludeFromReadingOrder: true,
            selectable: false,
            moduleId: 'footer',
            x: 0,
            y: 500,
            w: 200,
            h: 20,
          },
        ],
      }),
    ]);

    const byKind = Object.fromEntries(layers.map((l) => [l.kind, l]));
    assert.ok(byKind.watermark);
    assert.equal(byKind.watermark!.defaultDisposition, 'discard');
    assert.equal(byKind.watermark!.labelVi.includes('không cần đọc'), true);
    assert.equal(byKind.watermark!.knowledgeHints.length, 0);
    assert.ok(byKind.body);
    assert.equal(byKind.body!.defaultDisposition, 'keep');
    assert.ok(byKind.footer);
    assert.equal(byKind.footer!.defaultDisposition, 'discard');
    assert.ok(byKind['legal-basis']);
    assert.ok(byKind['legal-basis']!.knowledgeHints.some((h) => h.nodeId === 'can-cu'));
    assert.ok(byKind.body!.knowledgeHints.some((h) => h.nodeId === 'trich-yeu'));

    const dispositions = seedLayerDispositions(layers, {});
    assert.equal(dispositions[byKind.watermark!.id], 'discard');
    assert.equal(dispositions[byKind.signature!.id], 'discard');
    assert.equal(dispositions[byKind.body!.id], 'keep');
    assert.equal(dispositions[byKind['legal-basis']!.id], 'keep');
    assert.equal(dispositions[byKind.footer!.id], 'discard');

    const hidden = modulesHiddenByDispositions(layers, dispositions);
    assert.ok(hidden.includes('watermark'));
    assert.ok(hidden.includes('signature'));
    assert.ok(hidden.includes('footer'));
    assert.ok(!hidden.includes('article'));

    const hints = hintsFromKeptLayers(layers, dispositions);
    assert.ok(hints.some((h) => h.nodeId === 'can-cu'));
    assert.ok(!hints.some((h) => h.layerId === byKind.watermark!.id));
  });

  it('does not duplicate the same text across watermark and body', () => {
    const shared =
      'triển khai BCP theo Thông tư 83/TT-NHNN và Công văn số 31760/BIDV-QLRRHD';
    const layers = deriveLayoutLayers([
      snap({
        pageNumber: 1,
        regions: [
          {
            id: 'r-wm',
            kind: 'watermark',
            label: 'WM',
            text: shared,
            itemIds: [],
            excludeFromReadingOrder: true,
            selectable: false,
            moduleId: 'watermark',
            x: 0,
            y: 0,
            w: 100,
            h: 100,
          },
          {
            id: 'r-body',
            kind: 'single-column',
            label: 'Body',
            text: `${shared}\nNội dung riêng chỉ thuộc thân văn bản.`,
            itemIds: [],
            excludeFromReadingOrder: false,
            selectable: true,
            moduleId: 'article',
            x: 0,
            y: 120,
            w: 200,
            h: 200,
          },
        ],
      }),
    ]);
    const byKind = Object.fromEntries(layers.map((l) => [l.kind, l]));
    assert.ok(byKind.watermark);
    assert.ok(byKind.body);
    assert.match(byKind.watermark!.fullText, /31760/);
    // Body must not re-host the watermark plane text as its primary content
    assert.ok(!byKind.body!.fullText.includes('31760/BIDV-QLRRHD'));
    assert.match(byKind.body!.fullText, /Nội dung riêng/);
  });

  it('header keep when hints exist, else discard', () => {
    const withHints = deriveLayoutLayers([
      snap({
        pageNumber: 1,
        regions: [
          {
            id: 'r-h',
            kind: 'header',
            label: 'H',
            text: 'Số: 99/BIDV-TEST\nVề việc: Kiểm thử đầu trang',
            itemIds: [],
            excludeFromReadingOrder: false,
            selectable: true,
            moduleId: 'header',
            x: 0,
            y: 0,
            w: 200,
            h: 40,
          },
        ],
      }),
    ]);
    assert.equal(withHints[0]?.defaultDisposition, 'keep');

    const emptyHeader = deriveLayoutLayers([
      snap({
        pageNumber: 1,
        regions: [
          {
            id: 'r-h2',
            kind: 'header',
            label: 'H',
            text: 'LOGO ONLY XXX',
            itemIds: [],
            excludeFromReadingOrder: true,
            selectable: false,
            moduleId: 'logo',
            x: 0,
            y: 0,
            w: 80,
            h: 40,
          },
        ],
      }),
    ]);
    assert.equal(emptyHeader[0]?.defaultDisposition, 'discard');
  });

  it('seedLayerDispositions is idempotent and preserves user choice', () => {
    const layers = deriveLayoutLayers([
      snap({
        pageNumber: 1,
        regions: [
          {
            id: 'r-wm',
            kind: 'watermark',
            label: 'WM',
            text: 'WM',
            itemIds: [],
            excludeFromReadingOrder: true,
            selectable: false,
            moduleId: 'watermark',
            x: 0,
            y: 0,
            w: 10,
            h: 10,
          },
          {
            id: 'r-body',
            kind: 'single-column',
            label: 'B',
            text: 'Về việc: A\nNội dung đủ dài để gợi ý đoạn mở đầu nếu cần.',
            itemIds: [],
            excludeFromReadingOrder: false,
            selectable: true,
            moduleId: 'article',
            x: 0,
            y: 10,
            w: 100,
            h: 100,
          },
        ],
      }),
    ]);
    const seeded = seedLayerDispositions(layers, {});
    const again = seedLayerDispositions(layers, seeded);
    assert.equal(again, seeded);

    const wm = layers.find((l) => l.kind === 'watermark')!;
    const overridden = seedLayerDispositions(layers, { [wm.id]: 'keep' });
    assert.equal(overridden[wm.id], 'keep');
  });

  it('dispositionStorageKey is stable per document', () => {
    assert.equal(
      dispositionStorageKey('doc-1'),
      'orc.layout.dispositions.v1.doc-1',
    );
  });

  it('returns empty when no regions', () => {
    const layers: LayoutLayer[] = deriveLayoutLayers([snap({ pageNumber: 1 })]);
    assert.equal(layers.length, 0);
  });
});
