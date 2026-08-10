# Recognition Comparison Matrix

> Nguồn điểm: `lab/provisional-scorecards.ts` — **provisional** đến khi chạy đủ dataset (`dataset/DATASET_MANIFEST.md`).  
> Cập nhật cột RC/VC/BC/KC bằng số đo thật; không bảo vệ điểm giả thuyết.

## Legend

| Ký hiệu | Nghĩa |
|---|---|
| RC | Recognition Coverage |
| VC | Visual Coverage |
| BC | Business Coverage |
| KC | Knowledge Coverage (mô phỏng confirm) |
| UR | Unknown Regions (thấp hơn tốt) |
| RUV | Real User Value (50 VB/ngày) |
| ORC | Suitability for ORC locks |

Điểm 1–5: cao hơn tốt (trừ UR là count).

---

## Matrix (provisional)

| ID | Strategy | RC | VC | BC | KC | UR | Speed | Mem | Cx | Maint | Ext | ORC | RUV | Verdict tạm |
|---|---|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---:|---|
| A | Embedded only | 0.55 | 0.40 | 0.50 | 0.45 | 12 | fast | low | 1 | 5 | 2 | 5 | 2 | Baseline · **không đủ** |
| B | OCR full page | 0.88 | 0.95 | 0.80 | 0.55 | 2 | slow | high | 3 | 3 | 3 | 2 | 3 | Phủ cao · **từ chối làm default** |
| C | Text+OCR merge | 0.90 | 0.95 | 0.82 | 0.58 | 2 | slow | high | 4 | 2 | 3 | 3 | 3 | Đắt gần B · merge khó |
| D | Gap→OCR ROI | 0.90 | 0.92 | 0.85 | 0.70 | 3 | med | med | 3 | 4 | 5 | 5 | 5 | **Strong candidate** |
| E | Layout first | 0.70 | 0.75 | 0.75 | 0.65 | 6 | fast | low | 3 | 4 | 5 | 5 | 4 | Router · không standalone |
| F | Seg→OCR | 0.86 | 0.90 | 0.78 | 0.60 | 4 | med | med | 4 | 3 | 4 | 4 | 4 | Bổ sung D |
| G | Hybrid multi-pass | 0.96 | 0.98 | 0.92 | 0.85 | 1 | med | med | 5 | 3 | 5 | 5 | 5 | **Recommended architecture** |
| H | Template/manual/barcode | 0.99* | 0.99* | 0.95* | 0.90* | 0* | fast | low | 2 | 4 | 5 | 5 | 5 | Escape last mile (*khi dùng đúng chỗ*) |

\* H không chạy một mình trên mọi doc — điểm là trần khi kết hợp G.

---

## Rank by Real User Value × ORC (provisional)

1. **G** Hybrid (cần D+E+F bên trong)  
2. **D** Gap→ROI (core engine)  
3. **E** + **H** (router + last mile)  
4. **F**  
5. **C** / **B** (lab so sánh, không default)  
6. **A** (baseline bắt buộc giữ để đo delta)

## Real User check

| Strategy | 50 VB/ngày? |
|---|---|
| A | Không — thiếu patch ảnh, clerk nghĩ máy hỏng |
| B | Có chữ hơn nhưng chờ lâu + rác WM |
| D/G | Có — nhanh trên text sạch, OCR chỉ chỗ thiếu |
| H lasso | Có — 5 giây cứu 1 ROI còn lại |

## Cập nhật sau thí nghiệm

Thay số trong bảng này + `provisional-scorecards.ts`. Gắn link file JSON trong `dataset/RESULTS/` (local).
