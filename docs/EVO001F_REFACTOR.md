# EVO001F_REFACTOR.md

| Before | After |
|---|---|
| Text → plugins → RO | Region partition → objects → region-first RO |
| Flat modules only | DocumentRegionGraph + capabilities |
| Selection global | Dominant-region scoped |
| UI structure list only | + Document Capability Panel |

## Files added

- `pdf/region-engine/*`
- `components/document-capability-panel.tsx`
- `docs/EVO001F_*`

## Files changed

- `pdf/pipeline.ts` — region-first entry
- `pdf/types.ts` — `regionGraph?`
- `pdf/selection-engine.ts` — region scope
- `workspace-page.tsx` — capability panel
- `pdf-viewer` snapshot — capabilities

## Non-goals this wave

Full Knowledge Tree redesign (Document → Header → …) deferred; Capability + Structure panels bridge UX.
Continuous virtualization of 1000+ pages deferred (page window already ± sticky).
