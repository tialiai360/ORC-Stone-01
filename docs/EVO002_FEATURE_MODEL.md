# EVO002_FEATURE_MODEL.md

Per-primitive `ObjectFeatures`:

- **geometry** — x,y,w,h,cx,cy,area,aspect  
- **visual** — opacity, rotation, RGB, reddish, low-opacity  
- **typography** — fontSize/weight, charCount, hasText  
- **position** — top/bottom/center bands vs page  
- **source** — primitiveId, kind, textItemId  

Normalization (DPL): Unicode NFC, rotation wrap, opacity clamp, bbox round.
