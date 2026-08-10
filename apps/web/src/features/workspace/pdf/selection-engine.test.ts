import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveDoiObjectFromHitIds } from './selection-engine';
import type { PageStructureModel } from './types';
import type { DocumentObjectGraph } from './intelligence/doi/types';

describe('resolveDoiObjectFromHitIds', () => {
  it('returns dominant non-body DOI object for hit items', () => {
    const objectGraph = {
      pageNumber: 1,
      pageWidth: 600,
      pageHeight: 800,
      fingerprint: 't',
      primitives: {
        pageNumber: 1,
        pageWidth: 600,
        pageHeight: 800,
        primitives: [],
        source: { adapterId: 't', format: 'pdf', adapterVersion: '1' },
        fingerprint: 't',
      },
      objects: [
        {
          id: 'obj-body',
          pageNumber: 1,
          class: 'body-text',
          confidence: 'MEDIUM',
          confidenceScore: 0.6,
          reasons: [],
          evidence: [],
          features: {} as never,
          primitiveIds: [],
          textItemIds: ['item-1'],
          regionHint: 'main',
          bbox: { x: 0, y: 0, w: 10, h: 10 },
        },
        {
          id: 'obj-head',
          pageNumber: 1,
          class: 'heading',
          confidence: 'HIGH',
          confidenceScore: 0.9,
          reasons: ['cue'],
          evidence: [],
          features: {} as never,
          primitiveIds: [],
          textItemIds: ['item-1', 'item-2'],
          regionHint: 'main',
          bbox: { x: 0, y: 0, w: 10, h: 10 },
        },
      ],
      relations: [],
      diagnostics: {
        totalPrimitives: 2,
        totalObjects: 2,
        recognizedObjects: 2,
        unknownObjects: 0,
        objectCoverage: 100,
        byClass: { heading: 1, 'body-text': 1 },
        detectorCount: 1,
        notes: [],
      },
      capabilities: [],
      engineVersion: 'test',
    } satisfies DocumentObjectGraph;

    const model = { objectGraph } as unknown as PageStructureModel;
    const hit = resolveDoiObjectFromHitIds(model, new Set(['item-1']));
    assert.deepEqual(hit, { objectId: 'obj-head', objectClass: 'heading' });
  });
});
