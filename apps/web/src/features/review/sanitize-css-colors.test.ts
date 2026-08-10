import assert from 'node:assert/strict';
import { replaceUnsupportedColorFns } from './sanitize-css-colors';

assert.equal(
  replaceUnsupportedColorFns('oklab(0.5 0.1 -0.1)'),
  'transparent',
);
assert.equal(
  replaceUnsupportedColorFns('color-mix(in srgb, var(--accent) 35%, transparent)'),
  'transparent',
);
assert.equal(
  replaceUnsupportedColorFns('0 0 0 2px color-mix(in srgb, var(--accent) 55%, transparent)'),
  '0 0 0 2px transparent',
);
assert.equal(replaceUnsupportedColorFns('rgb(255, 0, 0)'), 'rgb(255, 0, 0)');
assert.equal(replaceUnsupportedColorFns('#f3f2f1'), '#f3f2f1');

console.log('sanitize-css-colors: ok');
