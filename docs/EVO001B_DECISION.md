# EVO001B_DECISION.md

> **EVO-001B** Decision — Continuous Improvement  
> Date: 2026-07-18

---

## Decision

### **READY WITH CONDITIONS**

### Continue: **authorized to keep improving** under Continuous Improvement Authority  
(Stop only when user requests STOP or a conflicting lock wave.)

---

## Delivered this cycle

1. PdfViewer analyze/paint split (critical perf)  
2. Selection bridge for structure-aware Ctrl+digit assign  
3. Diagnostics + Evidence on Workbench chrome  
4. Focus layout snapshot restore  
5. Additive workbench shortcuts  
6. VI/a11y consistency pass  
7. Toolbar fit-width + page input  
8. Architecture note `EVO001B_CONTINUOUS.md`

## Validation

- `npm run typecheck -w @orc/web`  
- `npm run test -w @orc/web`

## Conditions / next continuous targets

- Continuous multi-page scroll (±1 lazy)  
- Dead-code trim (`paragraphsToBlocks` legacy if unused)  
- Further workspace-page extraction (export hook)  
- Full VR-* validation surface  

---

Locks: **PASS**
