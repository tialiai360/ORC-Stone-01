# EVO002_ANALYZE.md

> **EVO-002** Document Object Intelligence + Master Stabilization  
> Design + Implementation AUTHORIZED · Absolute Locks apply

**As of:** 2026-07-19

---

## Gap (pre-wave)

| Area | State |
|---|---|
| Pipeline | Region-first (EVO-001F) but objects mostly text-plugin cues |
| Primitives | TextLayer only — no DPL / adapter contract |
| Classification | Scattered heuristics, not fused/explainable |
| Viewer | Zoom/paint/`onStructure` could loop → continuous flicker |
| Formats | PDF-only hard dependency in practice |

## Problems addressed

1. Continuous UI flicker (analyze↔paint↔TextLayer remount loop)  
2. Missing Document Object Intelligence first stage  
3. Master Evolution charter: Adapter → DPL → DOI → DRE (progressive, plugin-first)

## Constraints

No OCR · No AI/LLM · Raw immutable · UX/DIL/KPL/LAB/Evidence/Review locks unchanged · Evolve only
