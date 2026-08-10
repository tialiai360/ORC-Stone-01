# P0 Stabilization — Refactor Report

## Backend

| Item | Change |
|---|---|
| Storage provider | Global `StorageModule` + `STORAGE_PATHS` (confirmed) |
| Persistence boundary | Barrel `common/storage/index.ts` documents FS vs PG split |
| Review store | `ReviewPackageStore` (confirmed) |
| TypeORM | `TYPEORM_SYNC` default `false` (confirmed) |
| Storage cleanup | gitignore + smoke removal (confirmed) |
| DocumentImport export | Removed invalid `STORAGE_ROOT` re-export (Nest boot fix) |

## Frontend

| Item | Change |
|---|---|
| Shared HTTP | `apps/web/src/lib/http.ts` (`apiGet` / `apiSend` / `apiUpload`) |
| Session ids | `lib/session-ids.ts` (reviewer + uploader) |
| Feature APIs | workspace / dil / document-import / review use http client |
| Hooks | `use-workspace-session`, `use-assignment-history`, `use-workspace-shortcuts`, `use-assign-flow`, `use-progressive-guide` |
| Components | `WorkspaceHeader`, `WorkspaceStatusBar`, `WorkspaceEvidenceFooter` |
| Helpers | `assignment-diff.ts` |
| Dead code | Removed unused `assign-menu.tsx` (FloatingHint remains UX path) |
| Page size | `workspace-page.tsx` reduced to thin compose (~270 lines) |

## Locks preserved

- UX-001 shortcuts / colors / pen / similar YES-NO / progressive helper
- DIL-001 panel accept/reject + confidence display
- Evidence optional reason + StructureCorrected flow
- Vietnamese UI copy
