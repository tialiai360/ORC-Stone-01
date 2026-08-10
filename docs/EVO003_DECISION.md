# EVO003_DECISION.md

> Date: 2026-07-21 · Wave: **EVO-003 Locator Architecture**

## Decision: **READY** · Continue: **AUTHORIZED**

### Summary
Introduce `ITextLocator`, `TextRegion`, `LocatorRegistry`. Default: geometric locator (no DOM). DOM hit mapping isolated under `locator/presentation/`.

### Compatibility
Backward compatible. Existing `selectionTextFromModel(pageEl)` retained. New `selectionTextFromRegions`.

### Risks
Low — presentation still may use DOM binder; Runtime DOI does not import DOM.

### Tests
`evolution/evo-003-008.test.ts` · Locator suite
