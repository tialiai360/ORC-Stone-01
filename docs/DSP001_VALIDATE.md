# DSP-001 — Validate

| Check | Result |
|---|---|
| `npm test -w @orc/web` | Pipeline + P0.6 + bootstrap |
| `npm run typecheck -w @orc/web` | Pass |
| `npm run build -w @orc/web` | Pass |

## Manual

| Item | How |
|---|---|
| Header excluded from body corpus | Diag → Headers ≥ 1; similar-search uses body corpus |
| Watermark non-blocking | DRAFT spans `pointer-events: none` |
| Footer / signature regions | Diag counters |
| Tables | Cell + whole-table blocks |
| Diagnostics panel | Workspace PDF → **Diag** toggle |
| Empty text layer | Banner unchanged (no OCR) |
| UX-001 / DIL | Unchanged contracts |
