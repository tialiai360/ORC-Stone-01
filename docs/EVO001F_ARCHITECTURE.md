# EVO001F_ARCHITECTURE.md

> **EVO-001F** Architecture

---

## 1. Pipeline

```
Page Parser
    ↓
Layout bands (geometry)
    ↓
Region Plugin Manager (ordered detectors)
    ↓
DocumentRegionGraph (SoT)
    ↓
Object detectors (table, signature, watermark, …) scoped by region
    ↓
Per-region Reading Order
    ↓
Selection Graph (region-bounded)
    ↓
Legacy StructureRegion adapter (UI / modules)
    ↓
Presentation · Knowledge · Evidence
```

---

## 2. Layers

| Layer | Owns |
|---|---|
| Region Engine | Partition, classify, graph, cache key |
| Object detectors | Typed objects inside regions |
| Reading Order | Per-region columns→blocks→paragraphs |
| Selection | Region-local continuity |
| Presentation | Show/Hide/Focus/Highlight/Isolate regions |
| Knowledge | Maps to region + object refs (additive) |

---

## 3. Plugin contract

```ts
RegionDetectorPlugin {
  id, regionKind, priority, labelVi
  detect(ctx) → DocumentRegion[]
}
```

Registry sorts by priority; later detectors may refine Unknown / Main.

---

## 4. Caching

`PageStructureModel.regionGraph` computed once per `(page, scale, text fingerprint)`.  
Paint / presentation never re-runs Region Engine (EVO-001B analyze≠paint preserved).

---

## 5. Conflict rule

Region Graph wins over ad-hoc geometry.  
DPK Knowledge remains SoT for ontology labels; Region Engine supplies layout ownership.
