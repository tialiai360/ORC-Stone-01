# EVO001F_REGION_ENGINE.md

> Region Engine — runtime contract

## Entry

`buildDocumentRegionGraph({ pageNumber, pageWidth, pageHeight, items, lines })`

## Plugins (default)

| Priority | Plugin | Kind |
|---|---|---|
| 10 | DefaultBandPartition | header/main/footer/margin |
| 40 | AppendixRegionDetector | appendix |
| 45 | AttachmentRegionDetector | attachment |
| 50 | MetadataRegionDetector | metadata |

Object attachment: legacy Structure Plugin Manager nested as `DocumentObject` under owning region.

## Extension

```ts
getDefaultRegionPluginManager().register({
  id: 'MyDetector',
  regionKind: 'unknown',
  labelVi: '…',
  priority: 60,
  detect: (ctx) => { …; return []; },
});
```

## Cache

Region graph lives on `PageStructureModel.regionGraph`.  
PdfViewer analyze≠paint ensures graph is not recomputed on highlight paint.
