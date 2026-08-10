import { Global, Module } from '@nestjs/common';
import { resolveStorageRoot, STORAGE_ROOT } from './storage-root';

/**
 * P0 — Single StorageRoot provider for all FS-backed capabilities.
 * DocumentImport / Classification / DIL / Review must inject STORAGE_ROOT
 * instead of re-resolving process.env independently.
 */
@Global()
@Module({
  providers: [
    {
      provide: STORAGE_ROOT,
      useFactory: () => resolveStorageRoot(),
    },
  ],
  exports: [STORAGE_ROOT],
})
export class StorageModule {}
