# EVO002_REGION_INTEGRATION.md

1. DOI runs (if flag on) before `buildDocumentRegionGraph`.  
2. Region capabilities OR-merged with DOI capabilities (`cap-*` ↔ `ocap-*`).  
3. High-confidence non-body DOI objects appended into matching `DocumentRegion.objects` (no replace).  
4. Reading order / selection remain Region-first (EVO-001F).  
5. `PageStructureModel.objectGraph` exposed for diagnostics / future Knowledge mapping.
