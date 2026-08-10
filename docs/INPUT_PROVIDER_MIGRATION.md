# INPUT_PROVIDER_MIGRATION.md

> Migration: hardcoded PDF TextLayer assumption → Input Provider Runtime

---

## Before

```
analyzePageElement → collectItemsFromTextLayer
runDoiEngine → createPdfTextLayerAdapter() (hardcoded)
```

## After

```
analyzePageElement → getDefaultInputRuntime().extractPage({ context: { pageEl } })
runDoiEngine → primitives? or Input Runtime.extractDplPage (no adapter import)
```

---

## Compatibility

| Legacy | Status |
|---|---|
| `createPdfTextLayerAdapter` | Deprecated thin bridge → Input Runtime |
| `InputAdapter` types | Kept; new code uses `IInputProvider` |
| `collectItemsFromTextLayer` | Remains in `geometry.ts`; **owned call path** is pdf-text provider |
| `hasUsableTextLayer` | Alias of `hasUsableText` |

---

## Call-site checklist

- [x] `run-doi.ts` — no PDF adapter import
- [x] `analyzePageElement` — via Input Runtime
- [x] Provenance on text primitives
- [x] Registry default: embedded-text only
- [x] Unit tests for registry / provenance
- [ ] Find/Selection full primitive-SoT (DOM projection still assists PDF UX; corpus is runtime text)

---

## Evidence / Review

No schema change. Assignments continue to snapshot selected text at human action time.  
Do not re-call providers during Review ZIP export.

---

## Adding a future provider (authorized wave only)

1. Implement `IInputProvider` in its own module (no edits to DOI detectors).
2. `registry.register(provider, { id: 'cap.input.derived-text', enabled: true, ... })`.
3. Emit provenance `source: 'derived-text'` + confidence.
4. Never branch Foundation / Knowledge on `engine` string.
