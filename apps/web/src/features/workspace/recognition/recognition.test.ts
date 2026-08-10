import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ObjectInsight } from '../pdf/viewer-types';
import {
  applyObjectCorrections,
  objectFingerprint,
} from './apply-corrections';
import { buildRecognitionMap, buildRecognitionSummary } from './build-map';
import type { ObjectCorrection } from './types';

function sampleObject(partial: Partial<ObjectInsight> & Pick<ObjectInsight, 'id' | 'class'>): ObjectInsight {
  return {
    pageNumber: 1,
    confidence: 'MEDIUM',
    confidenceScore: 0.6,
    reasons: ['rule'],
    left: 10,
    top: 20,
    width: 30,
    height: 8,
    textPreview: 'Chu ky giam doc',
    ...partial,
  };
}

describe('recognition corrections (presentation)', () => {
  it('fingerprint is stable for progressive match', () => {
    const a = objectFingerprint(1, 'signature', 'Chu  ky');
    const b = objectFingerprint(1, 'signature', 'Chu ky');
    assert.equal(a, b);
  });

  it('reclass changes display class without dropping geometry', () => {
    const o = sampleObject({ id: 'o1', class: 'stamp' });
    const corrections: ObjectCorrection[] = [
      {
        fingerprint: objectFingerprint(1, 'stamp', o.textPreview),
        objectId: 'o1',
        pageNumber: 1,
        action: 'reclass',
        originalClass: 'stamp',
        class: 'signature',
        textPreview: o.textPreview,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const [out] = applyObjectCorrections([o], corrections);
    assert.equal(out.displayClass, 'signature');
    assert.equal(out.class, 'signature');
    assert.equal(out.originalClass, 'stamp');
    assert.equal(out.corrected, true);
    assert.equal(out.left, 10);
  });

  it('reject marks object rejected', () => {
    const o = sampleObject({ id: 'o2', class: 'watermark' });
    const corrections: ObjectCorrection[] = [
      {
        fingerprint: objectFingerprint(1, 'watermark', o.textPreview),
        objectId: 'o2',
        pageNumber: 1,
        action: 'reject',
        originalClass: 'watermark',
        textPreview: o.textPreview,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const [out] = applyObjectCorrections([o], corrections);
    assert.equal(out.rejected, true);
    assert.equal(out.corrected, true);
  });

  it('confirm boosts confidence presentation', () => {
    const o = sampleObject({ id: 'o3', class: 'title', confidenceScore: 0.4 });
    const corrections: ObjectCorrection[] = [
      {
        fingerprint: objectFingerprint(1, 'title', o.textPreview),
        objectId: 'o3',
        pageNumber: 1,
        action: 'confirm',
        originalClass: 'title',
        textPreview: o.textPreview,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const [out] = applyObjectCorrections([o], corrections);
    assert.equal(out.confirmed, true);
    assert.equal(out.confidence, 'HIGH');
    assert.ok(out.confidenceScore >= 0.92);
  });
});

describe('recognition map', () => {
  it('builds cells from objects and regions when page size known', () => {
    const objects = applyObjectCorrections(
      [sampleObject({ id: 'o1', class: 'signature', left: 40, top: 70, width: 20, height: 10 })],
      [],
    );
    const cells = buildRecognitionMap(
      {
        pageNumber: 1,
        regions: [
          {
            id: 'r1',
            kind: 'header',
            label: 'Đầu trang',
            text: 'x',
            itemIds: [],
            excludeFromReadingOrder: true,
            selectable: false,
            moduleId: 'header',
            x: 0,
            y: 0,
            w: 500,
            h: 40,
          },
        ],
        flags: {},
        pageWidth: 500,
        pageHeight: 700,
      },
      objects,
    );
    assert.equal(cells.length, 2);
    assert.ok(cells.some((c) => c.source === 'region' && c.moduleId === 'header'));
    assert.ok(cells.some((c) => c.source === 'object' && c.objectClass === 'signature'));
  });

  it('summary counts live objects and corrections', () => {
    const objects = applyObjectCorrections(
      [
        sampleObject({ id: 'a', class: 'signature', confidenceScore: 0.3 }),
        sampleObject({ id: 'b', class: 'footer', confidenceScore: 0.9, textPreview: 'cc' }),
      ],
      [
        {
          fingerprint: objectFingerprint(1, 'footer', 'cc'),
          objectId: 'b',
          pageNumber: 1,
          action: 'reject',
          originalClass: 'footer',
          textPreview: 'cc',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    );
    const summary = buildRecognitionSummary({
      pagesAnalyzed: 2,
      objects,
      modules: [
        {
          moduleId: 'signature',
          labelVi: 'Chữ ký',
          pageNumbers: [1],
          regionCount: 1,
          actionable: true,
        },
      ],
      capabilities: [
        {
          id: 'cap.signature',
          labelVi: 'Chữ ký',
          present: true,
          regionKinds: ['main'],
        },
      ],
      correctionCount: 1,
    });
    assert.equal(summary.pagesAnalyzed, 2);
    assert.equal(summary.objectCount, 1);
    assert.equal(summary.rejectedCount, 1);
    assert.equal(summary.lowConfidenceCount, 1);
    assert.equal(summary.correctionCount, 1);
  });
});
