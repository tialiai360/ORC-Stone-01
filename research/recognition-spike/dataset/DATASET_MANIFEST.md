# Dataset Manifest — Recognition Spike

| Field | Value |
|---|---|
| **ID** | RRS-001-DS |
| **Status** | Manifest ready · corpus slots open |
| **Rule** | Không commit PDF gốc có dữ liệu nhạy cảm vào git. Đặt file local theo `local/` (gitignore). |

---

## Families (bắt buộc đủ trước khi chốt ranking cứng)

| Family ID | Mô tả | Mục tiêu phủ | Min docs |
|---|---|---|---|
| F-STD | PDF chuẩn, TextLayer sạch | Baseline Strategy A | 3 |
| F-SCAN | Scan full page / gần full | Strategy B/D/F | 3 |
| F-OVERLAY | Image overlay chữ / banner | Gap map + ROI | 2 |
| F-SIG | Chữ ký ảnh | Không OCR dump cả trang | 2 |
| F-STAMP | Con dấu ảnh | Segmentation / ROI | 2 |
| F-WM | Watermark chéo + text | Layout vs text | 3 |
| F-TABLE | Nhiều bảng | Layout-first | 2 |
| F-IMG | Nhiều hình minh họa | Không nhầm caption | 2 |
| F-TOOL | Xuất từ nhiều phần mềm (Word, Foxit, scanner vendor, core banking print) | Robustness | 4 |
| F-MIX | Mixed: text + scan patch + stamp + WM | Hybrid G | 4 |

**Tổng tối thiểu đề xuất:** ≥ 27 trang-mẫu (có thể nhiều trang/file).

## Local layout

```
research/recognition-spike/dataset/
  DATASET_MANIFEST.md          ← this file
  local/                       ← gitignored
    F-STD/...
    F-SCAN/...
  RESULTS/                     ← gitignored run outputs (JSON)
```

## Labeling (per page) — tối thiểu để đo Coverage

Không cần gắn nhãn “OCR gold” toàn văn nếu tốn kém. Dùng **grid / zone labels**:

| Zone class | Ví dụ |
|---|---|
| `embedded_text` | Đoạn có glyph TextLayer |
| `image_text` | Chữ trong ảnh / scan patch |
| `stamp` | Dấu |
| `signature` | Chữ ký ảnh |
| `watermark` | WM (thường bỏ khỏi đọc nghiệp vụ) |
| `barcode` / `qr` | Mã |
| `decorative` | Logo trang trí (không cần đọc) |
| `unknown` | Chưa phân loại |

Mỗi trang: danh sách zone + bbox (~PDF units) + `needs_reading: boolean` (nhân viên có cần nội dung này để làm việc không).

## Coverage ground truth (Business)

Với mỗi doc, liệt kê **trường nghiệp vụ tối thiểu** (số VB, ngày, trích yếu, căn cứ, yêu cầu…) — dùng cho **Business Coverage** / **Knowledge Coverage**, không phải CER/WER OCR.

## Privacy

- Che / dùng bản redacted khi có PII  
- Không upload corpus lên cloud trong spike (LAB-001 spirit)
