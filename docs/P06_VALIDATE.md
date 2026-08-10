# P0.6 — Validate

## Automated

| Check | Result |
|---|---|
| `npm test -w @orc/web` (rebuild + selection unit tests) | 8/8 pass |
| `npm run typecheck -w @orc/web` | Pass |
| `npm run build -w @orc/web` | Pass |

## Manual checklist (operator)

| Criterion | Expectation |
|---|---|
| Visible paragraph selectable when text layer exists | Text layer `pointer-events` + rebuild corpus |
| Annotation alignment | Highlights still tint text-layer spans; selection text cleaned |
| Page scaling / zoom | Rebuild runs after render + scale change |
| Scrolling | Scroll container; overlay chip corner-only |
| Multi-page | Per-page model reset; empty banner per page |
| Selection persistence | Assignments unchanged model (UX-001) |
| No-text page | Banner VN + EN; no OCR/AI |
| Instruction overlay | Collapsed chip; hover/click expand; auto-collapse after first assign; `?` force |

## Locks spot-check

Ctrl+1–9 · Esc · FloatingHint · Similar Có/Không · DIL Accept/Reject · Review export — untouched contracts.
