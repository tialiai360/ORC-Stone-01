# EVO002_OBJECT_MODEL.md

## ClassifiedObject

- `id`, `pageNumber`, `class` (ObjectClass)
- `confidence` / `confidenceScore`
- `reasons[]`, `evidence[]` (per-detector)
- `features`, `primitiveIds`, `textItemIds`
- `regionHint`, `bbox`, optional `text`

## ObjectRelation

`belongs-to` · `near` · `contains` · `repeats` · `above` · `below`

## DocumentObjectGraph

Primitives page + objects + relations + diagnostics + capabilities + `engineVersion`.

## Classes (v1)

body-text, heading, title, subtitle, logo, seal, signature, digital-signature, watermark, qr-code, barcode, stamp, table, table-border, chart, diagram, photo, icon, footnote, header, footer, margin-note, annotation, attachment, appendix, unknown
