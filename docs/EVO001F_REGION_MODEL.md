# EVO001F_REGION_MODEL.md

## DocumentRegionKind

`header` · `main` · `footer` · `margin` · `metadata` · `attachment` · `appendix` · `unknown`

## DocumentObjectType

`text` · `table` · `image` · `logo` · `watermark` · `seal` · `signature` · `digital-signature` · `qr-code` · `barcode` · `vector` · `chart` · `annotation` · `page-number` · `legal-unit` · `subject` · `other`

## DocumentRegionGraph

- `regions[]`
- `readingRegionOrder[]` — document stream (main → appendix → attachment)
- `diagnostics[]` — per-region coverage / confidence
- `capabilities[]` — UI capability panel

## Ownership

Every `DocumentObject.regionId` points to a `DocumentRegion`.  
Selection prefers single dominant region (no blind cross-band merge).

## DPK bridge

Object `moduleId` maps to DPK `MOD-*` via existing `dpk/module-map.ts`.
