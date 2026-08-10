# EVO003_DESIGN.md

## Design

```
TextPrimitivePage
    ↓
ITextLocator (geometric default)
    ↓
TextRegion[]  → PresentationHit (EVO-007)
```

## Interfaces
- `ITextLocator`: locateByPrimitiveIds · locateByQuery · locateByPoint · locateAll
- `TextRegion`: id, pageNumber, primitiveIds, bbox, text, locatorId
- `LocatorRegistry`

## Migration
Prefer geometric locator for knowledge/find-by-geometry. Keep DOM hit helper only in presentation.

## Compatibility
No Foundation / Review / Evidence schema changes.
