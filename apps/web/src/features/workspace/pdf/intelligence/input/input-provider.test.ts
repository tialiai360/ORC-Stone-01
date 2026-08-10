import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createDefaultInputRegistry,
  createInputRuntime,
  createPdfTextProvider,
  PDF_TEXT_CAPABILITY_ID,
  PDF_TEXT_PROVIDER_ID,
  resetDefaultInputRegistryForTests,
  resetDefaultInputRuntimeForTests,
  textPrimitivePageToGeomItems,
} from './index';

describe('Input Provider Architecture', () => {
  it('registers only embedded-text capability (enabled)', () => {
    resetDefaultInputRegistryForTests();
    const registry = createDefaultInputRegistry();
    const caps = registry.listCapabilities();
    assert.equal(caps.length, 1);
    assert.equal(caps[0]!.id, PDF_TEXT_CAPABILITY_ID);
    assert.equal(caps[0]!.enabled, true);
    assert.ok(!caps.some((c) => /ocr/i.test(c.id) || /ocr/i.test(c.providerId)));
  });

  it('pdf-text provider extracts geom with provenance on every primitive', () => {
    const provider = createPdfTextProvider();
    const page = provider.extractText({
      documentId: 'd1',
      pageNumber: 1,
      pageWidth: 600,
      pageHeight: 800,
      context: {
        textItems: [
          { id: 'a', text: 'Hello', x: 10, y: 20, w: 40, h: 12 },
          { id: 'b', text: 'World', x: 10, y: 40, w: 50, h: 12 },
        ],
      },
    });
    assert.equal(page.providerId, PDF_TEXT_PROVIDER_ID);
    assert.equal(page.primitives.length, 2);
    for (const p of page.primitives) {
      assert.equal(p.provenance.source, 'embedded-text');
      assert.equal(p.provenance.providerId, PDF_TEXT_PROVIDER_ID);
      assert.equal(p.provenance.confidence, 1);
      assert.equal(p.provenance.pageNumber, 1);
      assert.ok(p.provenance.bbox);
    }
    const geom = textPrimitivePageToGeomItems(page);
    assert.equal(geom.length, 2);
    assert.equal(geom[0]!.id, 'a');
  });

  it('runtime resolves provider without DOI knowing provider class', () => {
    resetDefaultInputRegistryForTests();
    resetDefaultInputRuntimeForTests();
    const runtime = createInputRuntime(createDefaultInputRegistry());
    const page = runtime.extractPage({
      documentId: 'd2',
      pageNumber: 2,
      pageWidth: 400,
      pageHeight: 500,
      context: {
        textItems: [{ id: 't', text: 'Điều 1', x: 0, y: 0, w: 80, h: 14 }],
      },
    });
    assert.ok(page.primitives[0]?.text.includes('Điều'));
    const dpl = runtime.extractDplPage({
      documentId: 'd2',
      pageNumber: 2,
      pageWidth: 400,
      pageHeight: 500,
      context: {
        textItems: [{ id: 't', text: 'Điều 1', x: 0, y: 0, w: 80, h: 14 }],
      },
    });
    assert.ok(dpl.primitives[0]?.provenance?.providerId === PDF_TEXT_PROVIDER_ID);
  });

  it('resolve returns null when no provider can process', () => {
    const registry = createDefaultInputRegistry();
    const provider = registry.resolve({
      documentId: 'x',
      pageNumber: 1,
      pageWidth: 1,
      pageHeight: 1,
      context: {},
    });
    assert.equal(provider, null);
  });
});
