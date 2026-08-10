# P0 Stabilization — Analyze (expanded)

## Wave

P0 Stabilization Wave — **backend + UI architecture refactor**, Product Locks preserved.

## Current design

### Backend (already largely landed)

| Concern | State |
|---|---|
| Shared `STORAGE_ROOT` | `apps/api/src/common/storage/` |
| Review store | `ReviewPackageStore` |
| `TYPEORM_SYNC` default | `false` |
| Storage hygiene | gitignore + smoke removed |
| README capability map | Present |

### Frontend

| Concern | State |
|---|---|
| God component | `workspace-page.tsx` ~744 lines (session, history, shortcuts, assign, export, layout) |
| HTTP | Raw `fetch` duplicated in workspace/dil/document-import/review |
| Shared client | Missing (`api-base.ts` only) |
| Dead code | `assign-menu.tsx` unused (FloatingHint is live UX-001 path) |
| Hooks layer | None |

## Problems

1. Workspace orchestration mixed with presentation → hard to maintain without UX regression risk.
2. Inconsistent HTTP error handling across features.
3. Duplicated session-id helpers (`reviewerId` vs uploader session).
4. Residual BE export bug fixed earlier (`STORAGE_ROOT` re-export).

## Product locks (non-negotiable)

- UX-001: pen model, colors, Ctrl+1–9 / Esc / ?, similar YES/NO never auto, VN UI
- DIL-001: confidence gate, human accept/reject, no OCR/AI
- KPL-001: design contracts only (no implementation expansion)
- Evidence / audit / traceability paths unchanged

## Proposed refactor (safe)

1. `lib/http.ts` + migrate feature APIs  
2. Extract hooks: session, history, shortcuts, assign-flow, progressive guide  
3. Extract chrome: Header, StatusBar, EvidenceFooter  
4. Pure helpers: `assignment-diff.ts`  
5. Remove dead `assign-menu.tsx`  
6. Document Analyze → … → Decision under `docs/P0_STABILIZATION_*`
