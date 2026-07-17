import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getBootstrapLabel } from './product.ts';

describe('web bootstrap', () => {
  it('labels product bootstrap shell', () => {
    assert.equal(getBootstrapLabel(), 'STONE-01 bootstrap');
  });
});
