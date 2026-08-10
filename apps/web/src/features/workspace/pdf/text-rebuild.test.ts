import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildLines,
  buildParagraphs,
  joinLineItems,
  rebuildPageTextModel,
  type TextItemGeom,
} from './text-rebuild';
import { cleanFragmentedSelection } from './selection-engine';

function item(
  id: string,
  text: string,
  x: number,
  y: number,
  w = 40,
  h = 12,
): TextItemGeom {
  return { id, text, x, y, w, h };
}

describe('P0.6 text rebuild', () => {
  it('joins line items with spaces for word gaps', () => {
    const line = joinLineItems([
      item('a', 'Thông', 10, 20, 36, 12),
      item('b', 'báo', 52, 20, 28, 12),
      item('c', 'HO', 90, 20, 20, 12),
    ]);
    assert.equal(line, 'Thông báo HO');
  });

  it('glues overlapping glyph fragments', () => {
    const line = joinLineItems([
      item('a', 'Th', 10, 20, 14, 12),
      item('b', 'ông', 23, 20, 22, 12),
    ]);
    assert.equal(line, 'Thông');
  });

  it('builds lines by vertical proximity', () => {
    const lines = buildLines([
      item('1', 'Hello', 10, 10, 40, 12),
      item('2', 'world', 55, 11, 40, 12),
      item('3', 'Next', 10, 40, 30, 12),
    ]);
    assert.equal(lines.length, 2);
    assert.equal(lines[0]!.text, 'Hello world');
    assert.equal(lines[1]!.text, 'Next');
  });

  it('orders two-column layout left then right', () => {
    const lines = buildLines([
      item('l1', 'Left1', 10, 20, 80, 12),
      item('r1', 'Right1', 220, 20, 80, 12),
      item('l2', 'Left2', 10, 40, 80, 12),
      item('r2', 'Right2', 220, 40, 80, 12),
    ]);
    const paras = buildParagraphs(lines, 400, 600);
    const corpus = paras.map((p) => p.text).join(' | ');
    const leftIdx = corpus.indexOf('Left1');
    const rightIdx = corpus.indexOf('Right1');
    assert.ok(leftIdx >= 0 && rightIdx >= 0 && leftIdx < rightIdx);
  });

  it('rebuildPageTextModel marks empty pages unusable', () => {
    const model = rebuildPageTextModel([], 600, 800);
    assert.equal(model.hasUsableText, false);
    assert.equal(model.usableCharCount, 0);
  });

  it('rebuildPageTextModel produces selectable corpus', () => {
    const model = rebuildPageTextModel(
      [
        item('1', 'Điều 1.', 20, 160, 50, 14),
        item('2', 'Nội dung', 80, 160, 70, 14),
        item('3', 'đoạn văn bản chính.', 20, 180, 200, 14),
      ],
      600,
      800,
    );
    assert.equal(model.hasUsableText, true);
    assert.ok(model.blocks.length >= 1);
    assert.match(model.corpus, /Điều 1/);
    assert.match(model.corpus, /văn bản chính/);
  });

  it('cleans fragmented browser selection newlines', () => {
    assert.equal(cleanFragmentedSelection('Thông\nbáo'), 'Thôngbáo');
    assert.equal(cleanFragmentedSelection('hello\n\nworld'), 'hello world');
  });
});
