import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const required = [
  'apps/web',
  'apps/api',
  'packages/shared',
  'packages/config',
  'docs',
  'docker',
  'scripts',
  'tests',
  '.github',
  'storage/uploads',
];

describe('MVP-001 repository structure', () => {
  for (const rel of required) {
    it(`has ${rel}`, () => {
      assert.equal(existsSync(join(root, rel)), true, `missing ${rel}`);
    });
  }
});
