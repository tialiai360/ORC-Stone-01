# EVO001_ANALYZE.md

> **EVO-001** — Stone-01 Final Evolution Wave (Workbench)  
> Date: 2026-07-18  
> Role: Analysis before redesign  
> Absolute Locks: Foundation · Ontology · Governance · Decision Records · DIL-001 · KPL-001 · UX-001 · No OCR/AI/LLM · Raw immutable

---

## 1. Current state (as-is)

| Area | State |
|---|---|
| Product | PDF viewer + knowledge highlighter + DSP structure modules |
| Layout | Fixed 300px right aside; stacked Structure + Knowledge tree |
| Modes | Normal / Authoring / Review / Reading (module presets) |
| Focus | Per-module focus only — no workspace Focus Mode |
| Navigation | Page prev/next in viewer — no outline / minimap / history |
| Knowledge UI | Tree explorer (“Cây kiến thức”) — weak progress/checklist |
| Architecture | `workspace-page.tsx` composes everything; hooks, no global store |
| DPK-001 | Knowledge SoT exists; Stone module IDs partially aligned (heuristic debt) |
| Selection | Structure-aware via `selection-engine` — no explicit Knowledge Object bind field |

---

## 2. Target state (to-be)

**Knowledge-centric Document Workbench** for daily banking knowledge work:

- Maximize document canvas; adaptive/collapsible/resizable panels  
- Workspace modes: Normal · Authoring · Review · Reading · **Focus**  
- Document layers (View only) aligned to DPK `MOD-*`  
- Outline + jump to Knowledge / Evidence / page  
- Knowledge Workspace: progress, missing nodes, evidence/review status  
- Selection binds to structure refs (block/region/module) when available  
- Cleaner module boundaries: rendering · interaction · presentation · knowledge · analysis  

---

## 3. Gaps prioritized

| P | Gap | Approach |
|---|---|---|
| P0 | Workbench shell (resize/collapse/focus) | New `workbench/` layout |
| P0 | Knowledge Workspace (not tree-only) | Redesign sidebar panel |
| P0 | Outline + nav history | Left rail + hook |
| P1 | DPK module map + legal structure (Điều/Khoản/Điểm) | `dpk/` + detector plugin |
| P1 | Selection → structureRef on assignments | Additive optional field |
| P2 | Toolbar progressive disclosure | Compact chrome in Focus |
| P2 | Diagnostics surfacing in workbench | Wire existing diag + summary |
| P3 | Virtualization / multi-page continuous | Deferred (single-page PDF still OK) |

---

## 4. Non-negotiables (verify every change)

- Ctrl+1–9 · Esc · `?` · Similar YES/NO never auto  
- Knowledge colors unchanged  
- No OCR / AI / LLM  
- Hide/Show/Highlight = Presentation only  
- Raw PDF bytes never rewritten  
- DIL / KPL product locks untouched  

---

## 5. Reference interaction patterns (adapt, don’t copy)

| Pattern | Source class | ORC adaptation |
|---|---|---|
| Focus / Immersive reading | Acrobat, Word | Focus Mode hides chrome |
| Outline pane | Acrobat, Word | Page + legal outline from detectors |
| Layer visibility | Acrobat, Drawboard | Document Structure modules |
| Knowledge checklist | Review systems / Obsidian | Progress + missing nodes |
| Contextual pens | Annotation tools | Existing PenToolbar — compact in Focus |

---

## 6. Decision for implementation

Proceed with **EVO-001 Workbench tranche** implementing P0+P1 above.  
Document architecture in `EVO001_ARCHITECTURE.md`.  
Validate with tests + typecheck; record Decision.
