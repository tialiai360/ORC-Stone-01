# P0 Stabilization — Validate

## Commands

| Command | Result |
|---|---|
| `npm run build -w @orc/shared` | Pass |
| `npm run build -w @orc/api` | Pass |
| `npm test -w @orc/api` | 22 suites / 61 tests pass |
| `npm run typecheck -w @orc/web` | Pass |
| `npm run build -w @orc/web` | Pass (Next 15.5.20) |
| `npm test -w @orc/web` | Pass |

## Routes (build)

| Route | Type |
|---|---|
| `/` | Static OK |
| `/documents` | Static OK |
| `/workspace/[documentId]` | Dynamic OK |

## Fixes applied during validate

1. html2canvas options typed via assertion (incomplete d.ts) — runtime options unchanged.
2. `product.test.ts` import path without `.ts` extension.

## Product lock smoke (manual expectation)

No intentional change to Ctrl+1–9, Esc, `?`, pen colors, FloatingHint, Similar Có/Không, DilPanel Chấp nhận/Bỏ qua.
