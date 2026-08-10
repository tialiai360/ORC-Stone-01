# EVO007_DECISION.md

> **EVO-007 Separate Evidence from Presentation** · **READY** · Continue **AUTHORIZED**

PresentationHit ← TextRegion  
KnowledgeTextUnit ← TextPrimitive  
Evidence/Review schemas **unchanged** — assignment still snapshots `text` + `pageNumber`.

Risk: call-sites must not pass PresentationHit into Knowledge helpers (guards throw).
