# EVO002_DECISION.md

> Date: 2026-07-19  
> Waves: EVO-002 DOI + Master Evolution foundation + Viewer flicker stabilization

---

## Decision

### **READY WITH CONDITIONS**

### Continue: **AUTHORIZED** for next incremental detectors / adapters (not STOP)

---

## Summary

Stone-01 Document Understanding now starts from **Objects (DOI)** before Regions:

1. **Flicker loop** cut (analyze/paint/structure fingerprint guards)  
2. **DOI Engine v1** — DPL, multi-detectors, fusion, object graph, cache, flag  
3. **Master Evolution skeleton** — Input Adapter contract; PDF TextLayer adapter; pipeline enrichment; object diagnostics in Diag UI  

Absolute Locks held. No OCR/AI. Raw immutable.

## Conditions (not production-complete)

1. Non-PDF adapters are interfaces only  
2. Vector/operator-list primitives not fully extracted  
3. Selectable/RO/object quality gates (99%+) not met/claimed  
4. Knowledge mapping still primarily selection/text; object-graph consumption partial  
5. Large-doc (>1000p) virtualization still page-window based  

## Evidence

| Gate | Result |
|---|---|
| Implementation | PASS (foundation) |
| Typecheck | required green |
| Unit tests | DOI + prior suites |
| Scorecard | ~3.9 / 5 |
| Locks audit | PASS |

## Changelog

- `apps/web/src/features/workspace/pdf/intelligence/**` DOI/DPL/adapters  
- `pipeline.ts` DOI-first enrichment  
- `pdf-viewer.tsx` / `workspace-page.tsx` anti-loop  
- `structure-diagnostics-panel.tsx` object metrics  
- `docs/EVO002_*.md`

---

## Follow-on

See **EVO-002b** (`docs/EVO002B_*.md`, 2026-07-21): Find, bookmarks, annotation DPL, QR/barcode detectors, continuous spacers.

See **EVO-002c** (`docs/EVO002C_DECISION.md`, `INPUT_PROVIDER_*.md`): Input Provider Architecture (embedded-text only; no derived-text impl).
