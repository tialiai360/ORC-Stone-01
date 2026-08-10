# Architecture Proposal — Recognition Substrate (Research)

| Field | Value |
|---|---|
| **ID** | RRS-001-ARCH |
| **Status** | Proposal (research) · **không** authorize implement sản phẩm |
| **Align** | `docs/ARCHITECTURE_REVIEW_RECOGNITION_OBJECTS.md` |

---

## 1. Mục tiêu kiến trúc

Stone đọc được gần như toàn bộ nội dung thực tế bằng **đa Recognition Source**, đo được Coverage, **không** sửa PDF gốc, **không** auto-ingest Knowledge.

## 2. Tách lớp (Photoshop mental model → ORC)

| Plane | Vai trò | Ghi chú |
|---|---|---|
| Evidence Raster | Mực gốc (canvas/render) | Immutable |
| Embedded Text | Glyph / TextLayer | Strategy A |
| Layout Planes | Header/body/stamp/WM… | Strategy E · harvest hiện có |
| Gap / Difference Map | Ink − explained | Điều khiển D/F |
| ROI Rasters | Crop thiếu | Input OCR/Vision |
| Recognition Objects | Đơn vị ổn định | Text · image_text · barcode… |
| Confirm Gate | Người Nhận/Sửa/✕ | Trước Knowledge |
| Knowledge | Hồ sơ đã confirm | Ngoài spike |

```
PDF bytes (immutable)
    │
    ├─► EmbeddedTextSource ──► RO candidates
    ├─► LayoutRouter ────────► zones / discard chrome
    ├─► GapDetector ─────────► missing ROIs
    ├─► RoiOcrSource ────────► RO candidates (optional capability)
    ├─► ImageSegSource ──────► RO candidates
    ├─► BarcodeQrSource ─────► RO candidates
    └─► HumanLassoSource ────► RO candidates
              │
              ▼
     Recognition Object Graph
              │
              ▼
     Coverage Metrics (RC/VC/BC) + Unknown Regions
              │
              ▼
     [PRODUCT LATER] Human confirm → Knowledge
```

## 3. Control plane: Coverage-driven, không engine-driven

Orchestrator (Strategy G):

1. Chạy A (rẻ).  
2. Tính Gap Map + BC tạm.  
3. Nếu BC ≥ ngưỡng nghiệp vụ → **early exit**.  
4. Else route ROI → D/F (không full-page trừ khi trang gần như scan).  
5. Specialized barcode/QR nếu zone gợi ý.  
6. UR còn lại → H manual / template.  

**Ưu tiên clerk:** dừng sớm khi đủ làm việc — không “OCR cho đẹp coverage”.

## 4. Hợp đồng Recognition Object (tối thiểu)

```ts
{
  id, pageNumber, bbox?,
  kind: 'text' | 'image_text' | 'stamp' | 'signature' | 'barcode' | 'qr' | 'other',
  text?: string,
  source: 'embedded' | 'ocr-roi' | 'ocr-page' | 'vision' | 'human' | ...,
  confidence: number,
  needsReading?: boolean,
  provenance: { strategyId, engine?, model?, cropHash? }
}
```

Knowledge **chỉ** thấy object đã confirm — không thấy dump engine.

## 5. ORC fitness

| Lock / principle | Cách giữ |
|---|---|
| Evidence immutable | Chỉ đọc/render; không ghi PDF |
| Human governance | Confirm trước Knowledge (sản phẩm sau) |
| Technology neutrality | Source = plugin; OCR không “là” Stone |
| No dump-to-Knowledge | PDR-004 |

## 6. Ranh giới spike vs sản phẩm

| Spike lab | Sản phẩm (sau Decision) |
|---|---|
| Chạy strategy, ghi JSON metrics | Capability registry enable |
| Không gắn Clean Desk | Wire suggest → Nhận/Sửa |
| Được phép OCR trong lab | OCR optional per PDR-004 |

## 7. Real User Validation

Kiến trúc này thắng nếu:

- Text sạch → gần như không chờ OCR  
- Patch ảnh chữ → ROI vài trăm ms–vài s, không full page  
- Clerk có nút khoanh cứu 1 vùng (H) khi UR còn  

Nếu orchestrator luôn full-page OCR «cho RC 99%» → **fail** tiêu chí 50 VB/ngày dù matrix đẹp.
