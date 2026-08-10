# P0 Stabilization — Architecture Review

## Current Design

Stone-01 is a wave-stacked Nest + Next app. Persistence splits PG/memory (metadata/evidence) vs JSON/FS under one `STORAGE_ROOT`. Workspace UI concentrates all HO mapping behavior in one page component while feature APIs each wrap `fetch`.

## Problem

Maintainability debt is concentrated: oversized workspace page + duplicated HTTP. Backend persistence was fragmented by token resolution; that is largely resolved. Expanding P0 without locking UX/DIL requires **move-only** frontend structure work.

## Root Cause

Successive labs (WAVE-01, LAB-001, UX-001, DIL-001) appended behavior into the same surface without introducing shared web infrastructure (HTTP client, hooks).

## Proposed Design

```
apps/web/src/
  lib/
    api-base.ts          # origin rewrite (unchanged contract)
    http.ts              # apiGet / apiSend / apiUpload
    session-ids.ts       # reviewer + uploader ids
  features/workspace/
    workspace-page.tsx   # thin compose
    hooks/               # session, history, shortcuts, assign, guide
    components/          # header, status, evidence
    assignment-diff.ts
    api.ts               # endpoints only
```

Backend keeps global `StorageModule` as the persistence boundary for FS paths (`STORAGE_PATHS`).

## Trade-offs

| Approach | Pros | Cons |
|---|---|---|
| Extract hooks/components (chosen) | Smaller files, testable units, lock-safe | More files |
| Full state library (Zustand/Redux) | Central store | Overkill; UX regression risk |
| Leave god component | Zero churn | Debt grows |

## Impact

- FE: clearer ownership; no intentional UX change  
- BE: docs + boundary clarity; no schema change  
- Ops: `TYPEORM_SYNC` remains opt-in  

## Compatibility

- Routes, evidence types, Review ZIP contents, DIL endpoints unchanged  
- Shortcut/color SoT remains `@orc/shared` `KNOWLEDGE_NODES`

## Risks

1. Hook extraction could break shortcut timing if deps wrong → mitigate by moving code literally.  
2. HTTP helper must preserve FormData upload (no forced JSON Content-Type).  
3. Dead-code removal of AssignMenu must not remove FloatingHint.

## Recommendation

**Proceed** with the proposed extract-and-compose refactor under Product Locks. Do not redesign interaction or DIL semantics in this wave.
