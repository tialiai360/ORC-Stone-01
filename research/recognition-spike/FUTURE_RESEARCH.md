# Future Research

| Field | Value |
|---|---|
| **ID** | RRS-001-FUT |

---

## 1. Ngay sau Phase-0 report

1. Đổ corpus local theo `dataset/DATASET_MANIFEST.md`  
2. Implement lab runners tối thiểu:  
   - A: extract TextLayer metrics  
   - Gap map: canvas ink mask − text bbox union  
   - D: stub ROI crop + pluggable OCR adapter (lab-only)  
3. Điền số thật vào matrix  

## 2. Câu hỏi nghiên cứu mở

| # | Câu hỏi | Thành công nếu |
|---|---|---|
| Q1 | Gap map false positive rate trên WM trang? | ROI WM không đẩy OCR khi `needsReading=false` |
| Q2 | Early-exit BC threshold bao nhiêu cho HO notice? | Clerk chấp nhận ≤1 salvage/trang |
| Q3 | Barcode/QR có ROI nghiệp vụ thường xuyên? | Decoder riêng vs Vision |
| Q4 | Template theo mẫu công văn HO có ROI thời gian? | H giảm UR rõ |
| Q5 | Vision multimodal vs OCR cổ điển trên stamp? | BC tăng không chậm RUV |

## 3. Strategy H candidates (discovery)

- Human lasso 1-click → OCR ROI  
- HO form templates (số VB / V/v anchor)  
- Signature presence detect without transcription  
- Table structure from ruled lines before OCR cells  
- Dual-render diff (PDF.js vs print raster) nếu vendor lệch TextLayer  

## 4. Ngoài scope cố ý

- Tích hợp Clean Desk  
- Ghi Knowledge  
- Đổi Foundation  
- Cloud OCR bắt buộc  

## 5. Gate sang sản phẩm (sau spike)

Chỉ khi:

- Matrix có số đo corpus (không provisional)  
- G thắng trên RUV + BC  
- PDR/Decision bật capability OCR/Vision (PDR-004)  
- Recognition Objects + confirm gate giữ nguyên  

## 6. Real User reminder

Mọi hướng future: nếu không rút được **phút/ngày** cho clerk 50 VB → hạ ưu tiên dù paper coverage đẹp.
