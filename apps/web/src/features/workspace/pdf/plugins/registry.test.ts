import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aggregateDetectedModules, getDefaultPluginManager } from './registry';
import { runDocumentStructurePipeline } from '../pipeline';
import type { TextItemGeom } from '../types';

function item(id: string, text: string, x: number, y: number, w = 40, h = 12): TextItemGeom {
  return { id, text, x, y, w, h };
}

describe('Structure Plugin Manager', () => {
  it('registers default detectors', () => {
    const mgr = getDefaultPluginManager();
    const ids = mgr.list().map((p) => p.id);
    assert.ok(ids.includes('HeaderDetector'));
    assert.ok(ids.includes('WatermarkDetector'));
    assert.ok(ids.includes('TableDetector'));
    assert.ok(ids.includes('LegalStructureDetector'));
  });

  it('aggregates only detected modules for UI', () => {
    const model = runDocumentStructurePipeline(
      [
        item('h1', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', 80, 10, 280, 14),
        item('b1', 'Nội dung điều khoản chính.', 20, 160, 220, 14),
        item('w1', 'CONFIDENTIAL', 140, 280, 140, 30),
      ],
      400,
      600,
      1,
    );
    const detected = aggregateDetectedModules([
      {
        pageNumber: 1,
        regions: model.regions,
        flags: model.moduleFlags ?? {},
        headerText: model.regions.find((r) => r.moduleId === 'header')?.text,
      },
    ]);
    const ids = detected.map((d) => d.moduleId);
    assert.ok(ids.includes('header'));
    assert.ok(ids.includes('watermark') || ids.includes('selectable-text-layer'));
    assert.ok(!ids.includes('barcode'));
  });
});
