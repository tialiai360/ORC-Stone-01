# DSP-001 — Audit

| Requirement | Status |
|---|---|
| Header detection & split | Pass (heuristic) |
| Footer detection | Pass |
| Watermark excluded from RO, non-blocking | Pass |
| Layout classification | Pass |
| Reading order body-only | Pass |
| Paragraph reconstruction | Pass (P0.6+) |
| Table recognition (zones/cells) | Pass (heuristic) |
| Signature region | Pass |
| Selection via blocks | Pass |
| Invisible / orphan diagnostics | Pass |
| Diagnostics mode UI | Pass (**Diag**) |
| No OCR/AI/raw mutation/locks | Pass |

## Residual

Heuristics only — complex nested tables, vertical scripts, and pathological fonts may need later tuning under a new authorized wave. UAT fixture PDFs are operator-supplied (checklist in REVIEW).
