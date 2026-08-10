# EVO001C_DECISION.md

> **EVO-001C** — Continuous Improvement (scroll + maintainability)  
> Date: 2026-07-18

---

## Runtime fix (prior)

`Cannot find module './997.js'` = stale Next.js `.next` cache after large refactor.  
**Remedy:** delete `apps/web/.next`, restart `npm run dev:web`.  
Workspace route returned **200** after clear.

---

## Delivered this cycle

| Item | Detail |
|---|---|
| Continuous scroll | Toolbar **1 trang / Cuộn ±1** — renders current±1 pages; IntersectionObserver syncs page; selection resolves correct page wrap |
| Outline long docs | >24 pages → jump input + window ±8 around current |
| Export hook | `use-review-export.ts` extracts Review ZIP orchestration |
| Locks | Unchanged |

## Validation

- typecheck `@orc/web`
- test `@orc/web`

## Decision

**READY WITH CONDITIONS** — continuous scroll is windowed (±1), not full virtualization.

## Next (optional)

Full-document continuous virtualization · paint highlights on neighbor pages · VR validation panel
