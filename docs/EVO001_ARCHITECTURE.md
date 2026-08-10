# EVO001_ARCHITECTURE.md

> **EVO-001** — Workbench architecture  
> Knowledge SoT: `ORC-Knowledge/.../DPK-001`  
> Implementation: `ORC-Stone-01/apps/web/src/features/workspace/`

---

## 1. Layer separation

```
┌─────────────────────────────────────────────────────────┐
│ Workbench Shell (layout / modes / panel chrome)         │
├────────────┬────────────────────────────┬───────────────┤
│ Outline    │ PDF Rendering (react-pdf)  │ Knowledge     │
│ Navigation │ + Interaction (selection)  │ Workspace     │
│            │ + Presentation (layers)    │ + Structure   │
├────────────┴────────────────────────────┴───────────────┤
│ Document Analysis Pipeline (DSP plugins · DPK map)      │
├─────────────────────────────────────────────────────────┤
│ Knowledge / Assignment / Evidence / DIL (existing)      │
└─────────────────────────────────────────────────────────┘
```

| Layer | Responsibility | Mutates Raw? |
|---|---|---|
| Rendering | pdf.js page + text layer | No |
| Interaction | selection, pens, shortcuts | No |
| Presentation | show/hide/highlight/focus modules | No |
| Analysis | detectors → regions/flags | No |
| Knowledge | assignments → nodes | Session data only |
| Storage | API session/evidence | Existing |

---

## 2. New modules

| Path | Role |
|---|---|
| `workbench/use-workbench-layout.ts` | Panel sizes, collapse, Focus chrome |
| `workbench/use-nav-history.ts` | Recent pages / jumps |
| `workbench/workbench-shell.tsx` | Resizable 3-column shell |
| `workbench/document-outline.tsx` | Pages + legal outline |
| `workbench/workbench-mode-bar.tsx` | Mode switcher |
| `knowledge/knowledge-progress.ts` | Coverage metrics |
| `knowledge/knowledge-workspace.tsx` | Progress + checklist + tree |
| `dpk/module-map.ts` | StructureModuleId ↔ MOD-* / ontology |
| `dpk/legal-structure.ts` | Regex legal unit helpers (no AI) |

---

## 3. Workspace modes

| Mode | Intent |
|---|---|
| `normal` | Default chrome + all layers as source |
| `authoring` | Hide repeated chrome; show structure aids |
| `review` | Show authority/structure modules |
| `reading` | Hide chrome; maximize body reading |
| `focus` | Immersive: collapse side panels & secondary chrome |

---

## 4. DPK alignment strategy

- Keep Stone `StructureModuleId` kebab ids for detectors (stable).  
- Map to DPK `MOD-*` + ontology class via `dpk/module-map.ts`.  
- Add detectors for `article` / `clause` / `point` / `subject` / `legal-basis` (heuristic regex).  
- UI labels Vietnamese; show DPK id in tooltip.  
- Do **not** claim “DPK-001 complete” — this is alignment tranche.

---

## 5. Selection → Knowledge Object

Additive on `ClassificationAssignment`:

```ts
structureRef?: {
  blockId?: string;
  regionId?: string;
  moduleId?: string;
  dpkClass?: string;
}
```

Binding is best-effort from structure model at assign time.  
UX-001 assign/reject/similar semantics unchanged.

---

## 6. Panel model

| Panel | Default | Behavior |
|---|---|---|
| Left Outline | 200px | Collapsible; resizable |
| Center Document | flex | Always maximized remaining space |
| Right Workspace | 320px | Structure + Knowledge tabs/sections; resizable |

Sizes persist in `localStorage` key `orc.workbench.layout.v1`.

---

## 7. Forbidden

OCR · AI · LLM · Raw rewrite · UX-001 color/shortcut changes · Auto Similar YES
