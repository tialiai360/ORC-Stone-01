# P0.6 — Audit

| Requirement | Status |
|---|---|
| Instruction overlay not permanent | Pass — chip + expand |
| Default collapsed / auto-hide after first use | Pass |
| Never block annotation area | Pass — corner chip |
| Canvas ↔ Text ↔ Selection sync | Pass — CSS + rebuild on render |
| Text block reconstruction | Pass — lines/paragraphs/blocks |
| Reading order (columns/header/footer) | Pass — interaction-only |
| No-text detection message | Pass — no OCR/AI |
| Selection via reconstructed blocks | Pass — selection-engine |
| Product locks preserved | Pass |

## Residual

Complex tables / vertical text may still be imperfect; best-effort heuristics only. Scanned PDFs correctly report non-selectable text.
