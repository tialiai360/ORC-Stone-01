# EVO001F_VALIDATE.md

> Validation — 2026-07-18

| Check | Result |
|---|---|
| `npm run typecheck -w @orc/web` | PASS |
| `npm run test -w @orc/web` | **24/24 PASS** |
| Region partition header/main/footer | PASS (unit) |
| Region-first RO excludes header chrome | PASS (unit) |
| Appendix cue | PASS (unit) |
| Legacy pipeline regressions | PASS |
| No OCR/AI introduced | PASS |
| Raw immutable (presentation only) | PASS |
| UX-001 / DIL / KPL untouched | PASS |

## Manual matrix (recommended)

| Fixture | Status |
|---|---|
| VN admin letter | Ready for human check |
| Banking procedure | Ready |
| Watermarked PDF | Unit covers DRAFT |
| Digitally signed | Heuristic flag only |
| Large PDF >1000p | Page window (prior EVO) — not full virtualize |
| Multi-column | Column detect inside region RO |
| Table-heavy | Object attachment + diagnostics |

## Gaps (conditions)

- Full Document Structure Tree UI (Document→Header→…) not replacing Knowledge tree yet  
- Image/chart detectors remain thin (text-cue / flags)  
- 1000-page continuous virtualization deferred  
