/**
 * Persistence boundary (FS): all filesystem-backed capabilities resolve paths
 * through STORAGE_ROOT + STORAGE_PATHS. Do not re-resolve process.env.STORAGE_ROOT
 * inside feature modules.
 *
 * Matrix: uploads/documents · sessions · dil · review · fixtures
 * Metadata/evidence/KE/TR remain PG or in-memory (METADATA_STORE), not this module.
 */
export { StorageModule } from './storage.module';
export {
  STORAGE_ROOT,
  STORAGE_PATHS,
  resolveStorageRoot,
} from './storage-root';
