# EVO002_ARCHITECTURE.md

## Target pipeline (Stone-01)

```
Input Adapter (PDF TextLayer v1)
    ↓
Document Primitive Layer (DPL) + Normalization
    ↓
Feature Engine
    ↓
DOI Multi-Detector Registry
    ↓
Confidence Fusion (explainable)
    ↓
Document Object Graph (+ relations)
    ↓
Document Region Engine (EVO-001F, consumes/enriches)
    ↓
Reading Order → Selection → DPK/Knowledge → Evidence → Review
```

## Layers

| Layer | Path |
|---|---|
| Feature flag | `intelligence/feature-flag.ts` (`orc.intel.doi.v1`) |
| Adapters | `intelligence/adapters/` |
| DPL | `intelligence/dpl/` |
| DOI | `intelligence/doi/` |
| Region | `region-engine/` (unchanged contract, enriched) |
| Pipeline | `pdf/pipeline.ts` |

## Caching

DOI graph cached by `(pageNumber, primitive fingerprint)`.  
Region Engine still owns layout SoT; DOI is additive first stage.
