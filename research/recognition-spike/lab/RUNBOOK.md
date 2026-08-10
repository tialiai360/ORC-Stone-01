# Lab runbook

## Mục đích

Chạy thí nghiệm Recognition **ngoài** product path. Không import từ `apps/web` Clean Desk.

## Chuẩn bị

1. Đặt PDF vào `dataset/local/<Family>/` (không commit).  
2. (Tuỳ chọn) tạo nhãn zone JSON cạnh file.  
3. Chọn strategy IDs cần chạy.

## Output

Mỗi lần chạy ghi:

```
dataset/RESULTS/<docId>/<strategyId>/page-<n>.json
```

Gồm: RecognitionObjectDraft[] · CoverageScores · DifferenceMap (`GAP_SCHEMA.md`).

## Adapters (lab)

OCR/Vision adapters **chỉ** sống dưới `research/recognition-spike/lab/adapters/` (tạo khi triển khai runner). Không đăng ký vào Input Provider sản phẩm trong spike này.

## So sánh

Cập nhật `COMPARISON_MATRIX.md` từ RESULTS — xoá chữ “provisional” khi đủ ≥ ngưỡng dataset.

## Lệnh gợi ý (khi có runner)

```bash
# ví dụ tương lai — chưa ship runner CLI trong Phase-0 docs
node --import tsx research/recognition-spike/lab/run.ts --doc local/F-MIX/a.pdf --strategies A,D,G
```
