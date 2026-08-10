# EVO001B_CONTINUOUS.md

> **EVO-001B** — Continuous Improvement (post Workbench tranche 1)  
> Date: 2026-07-18  
> Authority: Continuous Improvement — evolve without Absolute Lock mutation

---

## Architectural decisions

### AD-CI-01 — Analyze ≠ Paint (PdfViewer)

**Problem:** Every highlight/pen/flash change re-ran the full Document Structure Pipeline.  
**Decision:** Split into `analyzeStructure()` (page/scale/text-layer) and `paintPresentation()` (DOM styles + overlays from cached `pageModelRef`).  
**Effect:** Assigning Knowledge no longer re-detects header/watermark/tables.  
**Files:** `pdf-viewer.tsx`, uses `analyzePageElement` from `pipeline.ts`.

### AD-CI-02 — Selection bridge for Ctrl+1–9

**Problem:** Keyboard assign used raw `Selection.toString()` — fragmented text, no `structureRef`.  
**Decision:** `PdfSelectionBridge.capture()` exposes structure-engine selection; shortcuts call it.  
**Locks:** Ctrl+1–9 / Esc / `?` bindings unchanged — only capture quality improved.

### AD-CI-03 — Focus layout snapshot

**Problem:** Exiting Focus always forced panels open.  
**Decision:** `preFocusRef` snapshots layout before Focus; restore on exit.

### AD-CI-04 — Workbench chrome integration

Diagnostics chip + Evidence toggle live on mode bar; additive shortcuts Alt+[/]/E/F, PageUp/Down.  
UX-001 pens unchanged.

### AD-CI-05 — Label clarity

Module “Focus” → **Cô lập** (per-module). Workspace mode remains **Focus**.  
Chrome labels standardized Vietnamese.

---

## Also improved

| Item | Change |
|---|---|
| PdfViewer toolbar | Extracted + page jump input + fit width |
| Viewer types | `pdf/viewer-types.ts` |
| Shared modes | `workbench/modes.ts` |
| Nav history | No longer auto-push on every page flip |
| Shortcut helper | Documents workbench keys |
| a11y | `aria-pressed` / `aria-selected` / `aria-expanded` |

---

## Locks

All Absolute Locks held. No OCR/AI. Raw immutable. DIL/KPL/UX-001 semantics intact.
