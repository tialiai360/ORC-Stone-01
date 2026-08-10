# DSP-001 — Document Structure Pipeline

## Analyze

UAT gaps are structural (header/footer/watermark/columns/tables), not single bugs. P0.6 rebuilt lines/paragraphs; this wave adds a full **Interaction Layer** pipeline before annotation.

## Architecture

```
PDF (raw immutable)
  → Page Analysis (text-layer geometry)
  → Layout Analysis
  → Header / Footer Detection
  → Watermark Detection
  → Reading Order (body only)
  → Text Reconstruction
  → Selection Blocks
  → Annotation (UX-001 unchanged)
```

Code: `apps/web/src/features/workspace/pdf/`
- `pipeline.ts` — orchestrator
- `detect-header-footer.ts` / `detect-watermark.ts` / `detect-layout.ts`
- `reading-order.ts` / `diagnostics.ts` / `selection-engine.ts`
- `structure-diagnostics-panel.tsx` — developer Diag toggle

## Locks

No OCR · No AI · No raw mutation · UX-001 / DIL-001 / KPL-001 unchanged.

## Success mapping

| Goal | Mechanism |
|---|---|
| Header/Footer split | Regions `excludeFromReadingOrder` |
| Watermark non-blocking | Excluded from corpus; `pointer-events: none` on wm spans |
| Reading order | Columns → paragraphs without header/footer/wm |
| Tables | Gap heuristic + cell blocks |
| Signature | Separate selectable region |
| Diagnostics | Per-page counters + coverage + confidence |
| Selection | Blocks-first engine (P0.6+) |

## UAT dataset checklist

Operator should validate against (fixtures not bundled):

- [ ] Word-export PDF
- [ ] Scan-with-text-layer
- [ ] Multi-column
- [ ] Multi-table
- [ ] Watermark
- [ ] Digital signature
- [ ] Multi-appendix
- [ ] >500 pages (perf smoke)
- [ ] Embedded fonts
- [ ] Rotated text

## Decision

See `DSP001_DECISION.md`.
