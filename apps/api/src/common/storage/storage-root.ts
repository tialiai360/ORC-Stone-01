import { join } from 'node:path';

/** Injection token for filesystem storage root (uploads, sessions, dil, review). */
export const STORAGE_ROOT = Symbol('STORAGE_ROOT');

/**
 * Resolve STORAGE_ROOT once for the whole API process.
 * Default: monorepo `storage/` relative to Nest cwd (`apps/api` → `../../storage`).
 */
export function resolveStorageRoot(): string {
  return process.env.STORAGE_ROOT ?? join(process.cwd(), '..', '..', 'storage');
}

/** Logical subpaths under STORAGE_ROOT (persistence matrix). */
export const STORAGE_PATHS = {
  uploads: 'uploads',
  documents: 'uploads/documents',
  sessions: 'sessions',
  dil: 'dil',
  review: 'review',
  fixtures: 'fixtures',
} as const;
