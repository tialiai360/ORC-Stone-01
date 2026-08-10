# DSP-001b — Document Structure Modules & Visibility

## Scope (§14–§18)

| Item | Delivery |
|---|---|
| 14 Detected Modules | Plugin Manager runs detectors after page text-layer analysis |
| 15 Visibility Control | `DocumentStructure` panel — only detected modules; Show/Hide/Highlight/Focus |
| 16 Interaction Rules | Hide = Presentation opacity/overlay only; raw PDF / DIL unchanged |
| 17 Workspace Modes | Normal · Authoring · Review · Reading presets |
| 18 Plugin Extension | `StructurePluginManager` + `*Detector` plugins; viewer consumes results |

## Architecture

```
Upload → Workspace PDF page render
       → Plugin Manager (Header/Footer/Watermark/Table/…)
       → Detected Modules (UI list)
       → Presentation map (visible/highlight/focus)
       → PDF Viewer overlays (no raw mutation)
```

Code:
- `pdf/plugins/{types,detectors,registry}.ts`
- `hooks/use-structure-presentation.ts`
- `components/document-structure-panel.tsx`
- `pdf-viewer.tsx` (presentation overlays)

## Locks

No OCR · No AI · Raw immutable · UX-001 / DIL-001 / KPL-001 unchanged.

## Decision

**READY WITH CONDITIONS** — heuristic detectors; modules appear only when detected.
