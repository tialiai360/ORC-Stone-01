# Gap / Difference Map — schema (phân tích, không UI)

Mỗi trang sau một strategy pass xuất `DifferenceMap` JSON.

```json
{
  "pageNumber": 1,
  "strategyId": "D",
  "pageWidth": 595,
  "pageHeight": 842,
  "missingRegions": [
    {
      "id": "gap-1",
      "bbox": { "x": 120, "y": 400, "w": 180, "h": 40 },
      "areaRatio": 0.012,
      "possibleCause": "image_text_overlay",
      "suggestedStrategies": ["D", "F", "H-manual"],
      "confidence": 0.72,
      "needsReadingHypothesis": true
    }
  ],
  "stats": {
    "visualCoverage": 0.91,
    "unknownRegionCount": 3,
    "embeddedTextCharCount": 4200,
    "gapAreaRatio": 0.07
  }
}
```

## Cause taxonomy

| Cause | Gợi ý strategy |
|---|---|
| `no_text_layer` | B, F |
| `image_text_overlay` | D, F |
| `stamp` | F (ROI nhỏ) |
| `signature` | F hoặc skip business |
| `watermark_noise` | Layout discard / không OCR full |
| `barcode_qr` | specialized decoder |
| `font_subset_invisible` | render+OCR ROI |
| `unknown` | H-manual / Vision |

## Rule

Difference Map phục vụ **phân tích & routing strategy** — không bắt buộc surface sản phẩm trong spike.
