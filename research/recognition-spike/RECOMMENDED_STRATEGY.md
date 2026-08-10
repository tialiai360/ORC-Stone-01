# Recommended Strategy

| Field | Value |
|---|---|
| **ID** | RRS-001-REC |
| **Status** | Provisional recommendation (research) |
| **Primary** | **G — Hybrid Multi-pass** |
| **Core engine** | **D — Gap Detection → OCR ROI** |
| **Router** | **E — Layout First** |
| **Last mile** | **H — Manual lasso / template / barcode** |

---

## 1. Khuyến nghị một câu

**Đừng chọn “OCR hay không”. Chọn pipeline Coverage-driven: embedded trước → layout route → OCR đúng lỗ hổng → chuyên biệt → người khoanh phần còn lại.**

## 2. Vì sao G (không phải B)

| Tiêu chí | G Hybrid | B Full OCR |
|---|---|---|
| RC hướng ~100% | Có đường | Có nhưng đắt |
| 50 VB/ngày | Early exit trên text sạch | Chậm đều |
| Rác WM/ký | Layout discard + ROI | OCR cả trang |
| ORC | Multi-source + confirm | Dễ thành dump engine |
| Real User | Ưu tiên B (nhanh việc) | Dễ ưu tiên A (phủ máy) |

## 3. Pass khuyến nghị (chi tiết)

```
Pass 0  Render / structure snapshot (đã có hướng)
Pass 1  Strategy A — embedded text → RO
Pass 2  Strategy E — layout planes (keep/shelf)
Pass 3  Gap map (ink − explained)
Pass 4  If scan-dominant page → limited B or F full-ish
        Else Strategy D ROI OCR on gaps (needsReading)
Pass 5  Strategy F on stamp/sig/image blobs if still UR
Pass 6  Barcode/QR decoders if zones match
Pass 7  Strategy H human lasso / HO template
Stop    When BC ≥ threshold OR user accepts Unknown
```

## 4. Ngưỡng gợi ý nghiên cứu (chỉnh bằng corpus)

| Signal | Hành động |
|---|---|
| Embedded char dense + gapAreaRatio < 3% | Skip OCR |
| gapAreaRatio 3–25% | D only |
| Embedded ~0 + ink full | B or F page-level |
| UR after D/F | H |

## 5. Điều kiện chốt khuyến nghị khỏi “provisional”

Chạy dataset đủ family; G phải thắng B trên **RUV** (thời gian/clerk) với RC/BC không thua đáng kể.

Nếu corpus đa số pure scan và D không bắt kịp → **được phép** nâng trọng số B trong G (đổi giả định — đúng mission spike).

## 6. Không khuyến nghị làm sản phẩm ngay

Spike **không** authorize wire Clean Desk. Sau corpus: Decision/PDR riêng (OCR capability) rồi mới implement có kiểm soát.
