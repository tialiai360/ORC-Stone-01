# EVO002B_ANALYZE.md

## Scope (authorized under EVO-002 Continue)

Close the highest-pain PDF gaps without redesigning UX-001 or introducing OCR/AI:

| Gap | Approach |
|---|---|
| Weak QR/barcode | Geometric + lexical DOI detectors |
| No annotation primitives | Enable AnnotationLayer + DPL extract |
| Header false positives | Running-chrome gate on header/footer detector |
| Missing modern reader UX | Find + native bookmarks |
| Continuous scroll jump | Spacer virtualization + wider page window |

## Non-goals

- OCR / LLM extract
- Mutating PDF bytes
- Redesign highlighter / pen UX
- Full Adobe parity (thumbnails strip, comment tools)
