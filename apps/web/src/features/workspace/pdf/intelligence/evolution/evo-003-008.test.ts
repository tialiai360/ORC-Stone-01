import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createDerivedProvenance,
  type DerivedText,
} from '../derived';
import {
  createDefaultGovernedRegistry,
  isCapabilityRunnable,
  resetDefaultGovernedRegistryForTests,
} from '../governance';
import {
  createGeometricTextLocator,
  createDefaultLocatorRegistry,
  GEOMETRIC_LOCATOR_ID,
  resetDefaultLocatorRegistryForTests,
} from '../locator';
import {
  createDefaultPluginHost,
  resetDefaultPluginHostForTests,
} from '../plugin-sdk';
import {
  defaultEmbeddedResolutionPlan,
  executeResolutionPipeline,
} from '../resolution';
import {
  assertKnowledgeOnly,
  assertPresentationOnly,
  toKnowledgeTextUnit,
  toPresentationHit,
} from '../separation';
import { createDefaultInputRegistry } from '../input';
import type { TextPrimitivePage } from '../input/types';

function samplePage(): TextPrimitivePage {
  return {
    pageNumber: 1,
    pageWidth: 600,
    pageHeight: 800,
    providerId: 'provider.pdf-text.v1',
    fingerprint: 't',
    primitives: [
      {
        id: 'p1',
        text: 'Điều 1',
        pageNumber: 1,
        bbox: { x: 10, y: 10, w: 80, h: 14 },
        provenance: {
          source: 'embedded-text',
          providerId: 'provider.pdf-text.v1',
          providerVersion: '1.0.0',
          confidence: 1,
          pageNumber: 1,
          bbox: { x: 10, y: 10, w: 80, h: 14 },
        },
      },
      {
        id: 'p2',
        text: 'Nội dung',
        pageNumber: 1,
        bbox: { x: 10, y: 40, w: 100, h: 14 },
        provenance: {
          source: 'embedded-text',
          providerId: 'provider.pdf-text.v1',
          providerVersion: '1.0.0',
          confidence: 1,
          pageNumber: 1,
          bbox: { x: 10, y: 40, w: 100, h: 14 },
        },
      },
    ],
  };
}

describe('EVO-003 Locator Architecture', () => {
  it('geometric locator finds by query and point without DOM', () => {
    resetDefaultLocatorRegistryForTests();
    const loc = createGeometricTextLocator();
    const page = samplePage();
    const byQ = loc.locateByQuery(page, { query: 'điều' });
    assert.ok(byQ.length >= 1);
    assert.equal(byQ[0]!.locatorId, GEOMETRIC_LOCATOR_ID);
    const hit = loc.locateByPoint(page, { x: 15, y: 12 });
    assert.ok(hit);
    assert.ok(hit!.primitiveIds.includes('p1'));
    const reg = createDefaultLocatorRegistry();
    assert.equal(reg.default().id, GEOMETRIC_LOCATOR_ID);
  });
});

describe('EVO-004 Derived Text Architecture', () => {
  it('builds derived provenance without enabling a producer', () => {
    const prov = createDerivedProvenance({
      providerId: 'provider.derived.placeholder',
      providerVersion: '0.0.0',
      pageNumber: 1,
      confidence: 0.5,
    });
    assert.equal(prov.source, 'derived-text');
    const sample: DerivedText = {
      id: 'd1',
      text: '',
      pageNumber: 1,
      provenance: prov,
      derivation: {
        derivationId: 'der-1',
        method: 'method.unspecified',
        inputFingerprint: 'fp',
        producedAt: '2026-07-21T00:00:00.000Z',
        deterministic: true,
      },
    };
    assert.equal(sample.derivation.method, 'method.unspecified');
  });
});

describe('EVO-005 Capability Governance', () => {
  it('embedded-text is runnable; no vision capability registered', () => {
    resetDefaultGovernedRegistryForTests();
    const reg = createDefaultGovernedRegistry();
    const list = reg.listGoverned();
    assert.equal(list.length, 1);
    assert.equal(list[0]!.id, 'cap.input.embedded-text');
    assert.equal(isCapabilityRunnable(list[0]!), true);
    assert.ok(list[0]!.approval?.decisionRef);
    assert.ok(!list.some((c) => /ocr|vision|tesseract/i.test(c.id)));
  });
});

describe('EVO-006 Provider Resolution Pipeline', () => {
  it('first-success returns embedded provider page', () => {
    const registry = createDefaultInputRegistry();
    const page = executeResolutionPipeline(
      registry,
      {
        documentId: 'd',
        pageNumber: 1,
        pageWidth: 100,
        pageHeight: 100,
        context: {
          textItems: [{ id: 'a', text: 'Hi', x: 0, y: 0, w: 10, h: 10 }],
        },
      },
      defaultEmbeddedResolutionPlan(),
    );
    assert.ok(page.primitives.length >= 1);
    assert.equal(page.providerId, 'provider.pdf-text.v1');
  });
});

describe('EVO-007 Evidence / Presentation separation', () => {
  it('maps primitives to knowledge and regions to presentation', () => {
    const page = samplePage();
    const unit = toKnowledgeTextUnit(page.primitives[0]!);
    assert.equal(unit.kind, 'knowledge');
    assertKnowledgeOnly(unit);
    const loc = createGeometricTextLocator();
    const regions = loc.locateByPrimitiveIds(page, ['p1']);
    const hit = toPresentationHit(regions[0]!);
    assert.equal(hit.kind, 'presentation');
    assertPresentationOnly(hit);
    assert.throws(() => assertKnowledgeOnly(hit as never));
  });
});

describe('EVO-008 Plugin SDK', () => {
  it('hosts provider + locator + normalizer; no derived producer enabled', () => {
    resetDefaultPluginHostForTests();
    const host = createDefaultPluginHost();
    assert.ok(host.list('provider').length >= 1);
    assert.ok(host.list('locator').length >= 1);
    assert.ok(host.list('normalizer').length >= 1);
    assert.equal(host.listEnabledDerivedProducers().length, 0);
  });
});
