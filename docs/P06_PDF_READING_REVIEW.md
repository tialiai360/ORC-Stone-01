# P0.6 — PDF Reading & Selection Quality

## Analyze

### Problems
- Shortcut helper panel occupied workspace permanently.
- Fragmented PDF text-layer spans → broken selection / “visible but untouchable”.
- No distinction between scanned page (no text layer) vs app defect.
- Highlights matched raw span fragments only.

### Locks (unchanged)
UX-001 colors/shortcuts/pen/similar/progressive · DIL-001 no OCR/AI · LAB-001 review · Evidence model.

## Architecture

```
Canvas (react-pdf)
   ↓
Text Layer (DOM spans + CSS sync)
   ↓
Text Rebuild (items → lines → paragraphs → reading order → blocks)
   ↓
Selection Engine (normalize Selection → continuous text)
   ↓
Annotation (existing pen / FloatingHint — unchanged contracts)
```

Instruction overlay: collapsed chip → expand hover/click → auto-collapse after first assign; `?` still force-show.

## Refactor (files)
- `features/workspace/pdf/text-rebuild.ts`
- `features/workspace/pdf/selection-engine.ts`
- `features/workspace/pdf-viewer.tsx`
- `features/workspace/shortcut-helper.tsx`
- `app/globals.css` (text-layer sync)
- tests: `pdf/text-rebuild.test.ts`

## Validate
See `P06_VALIDATE.md` · `P06_AUDIT.md` · `P06_SCORECARD.md`.

## Decision
See `P06_DECISION.md` — **READY WITH CONDITIONS**.
