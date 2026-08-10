# EVO001F_ANALYZE.md

> **EVO-001F** — Document Region Engine  
> Date: 2026-07-18  
> Design + Implementation AUTHORIZED · Absolute Locks apply

---

## 1. As-is limit

Current DSP:

```
TextLayer spans → Lines → Module detectors → Reading Order (exclude chrome) → Selection blocks
```

Problems:

| Issue | Impact |
|---|---|
| Text-first | Layout meaning discovered late |
| Flat modules | Header/table/signature mixed without page partition |
| Global reading order | Crosses logical bands accidentally |
| Selection | Can span header→body without ownership |
| Knowledge | Binds to text spans, not semantic regions |
| Recompute | Analyze path improved (EVO-001B) but model still text-centric |

---

## 2. To-be

```
PDF Page
  → Page Parser (text geom — no OCR)
  → Page Layout Analysis
  → Document Region Detection (plugin)
  → Region Classification
  → Region-owned objects
  → Region-first Reading Order
  → Region Selection Graphs
  → Knowledge / Evidence / Presentation
```

**Region Engine = Source of Truth for layout.**

---

## 3. Constraints

- No OCR · No AI · No LLM  
- Raw PDF immutable  
- UX-001 / DIL-001 / KPL-001 unchanged  
- Heuristic geometry + text cues only  
- Compatible with existing StructureModuleId presentation where possible  

---

## 4. Migration strategy

1. Introduce `region-engine/` alongside DSP plugins (no big-bang delete).  
2. Pipeline runs Region Engine **first**, then maps legacy `StructureRegion` for UI.  
3. Reading order / selection prefer `DocumentRegion` ownership.  
4. Capability panel surfaces default regions + detected capabilities.  
5. Legacy detectors become object detectors **inside** regions over time.

---

## 5. Decision

Proceed to implement Region Engine foundation + wire pipeline + UI capability panel in this wave.
