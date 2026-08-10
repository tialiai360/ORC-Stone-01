import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findInPageCorpora } from './pdf-find';

describe('EVO-002b pdf-find', () => {
  it('finds query across page corpora (case-insensitive)', () => {
    const matches = findInPageCorpora(
      {
        1: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
        2: 'Điều 1. Phạm vi điều chỉnh',
        3: 'Nội dung khác',
      },
      { query: 'điều 1', caseSensitive: false },
    );
    assert.equal(matches.length, 1);
    assert.equal(matches[0]!.pageNumber, 2);
    assert.ok(matches[0]!.preview.toLowerCase().includes('điều'));
  });

  it('returns empty for blank query', () => {
    assert.deepEqual(
      findInPageCorpora({ 1: 'hello' }, { query: '  ', caseSensitive: false }),
      [],
    );
  });
});
