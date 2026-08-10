# EVO002_DETECTORS.md

Registry: `DoiDetectorRegistry` — register / list / run independently.

| Detector | Id | Signals |
|---|---|---|
| Text | det.text.v1 | char count, opacity |
| Heading/Title | det.heading.v1 | font size, bold, Điều/…, quốc hiệu |
| Watermark | det.watermark.v1 | low opacity, rotation, area |
| Seal | det.seal.v1 | bottom, reddish, aspect |
| Signature | det.signature.v1 | bottom + signer cues |
| Header/Footer | det.header-footer.v1 | band + text |
| Table cue | det.table-cue.v1 | aligned rows |
| Image | det.image.v1 | image primitive / canvas proxy |
| Appendix/Attachment | det.appendix-attachment.v1 | lexical cues |
| QR Code | det.qr.v1 | lexical + square geometry / square annot |
| Barcode | det.barcode.v1 | lexical + wide aspect |
| Annotation | det.annotation.v1 | AnnotationLayer link/form |

Each hit: `score`, `reasons[]`, `detectorVersion`. Fusion picks max class with priority boost.

> EVO-002b: header/footer requires running-chrome cues (not every top/bottom band text).
