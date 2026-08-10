# Metrics — Recognition Spike

KPI chính **không** phải OCR accuracy.

---

## 1. Recognition Coverage (RC)

Tỷ lệ nội dung **có thể đưa vào pipeline Recognition Object** (embedded hoặc nguồn khác), so với nội dung người cần đọc.

```
RC = chars_or_zones_recognized / chars_or_zones_needed
```

Ưu tiên đo theo **zone có `needs_reading=true`**, không theo toàn bộ pixel trang.

## 2. Visual Coverage (VC)

Tỷ lệ vùng mực trực quan đã được **giải thích** (text / image_text / stamp / … / decorative), kể cả vùng không cần đọc.

```
VC = explained_area / ink_area_approx
```

Dùng Difference Map + ink mask thô (canvas luminance / edge).

## 3. Business Coverage (BC)

Tỷ lệ **trường nghiệp vụ tối thiểu** của doc đã có Recognition Object ứng viên (chưa cần confirm Knowledge).

```
BC = business_fields_with_candidate / business_fields_required
```

## 4. Knowledge Coverage (KC)

Tỷ lệ trường đã **qua confirm người** vào Knowledge (trong spike: mô phỏng confirm; không ghi Knowledge sản phẩm).

```
KC = confirmed_fields / business_fields_required
```

## 5. Unknown Regions (UR)

Số ROI còn `unknown` sau pass cuối — càng thấp càng tốt; kèm diện tích.

## 6. Secondary (không phải North Star)

| Metric | Dùng để |
|---|---|
| Accuracy (spot-check) | So mẫu ROI OCR vs human transcription |
| Speed | trang/phút, p95 latency |
| Memory | peak RSS / GPU |
| Complexity | số pass, số dependency |
| Maintainability | 1–5 rubric |
| Extensibility | thêm source mới có cần đụng Foundation không |
| Suitability for ORC | Evidence immutable · human gate · no dump-to-Knowledge |

## 7. Real User proxy

| Proxy | Cách đo thô |
|---|---|
| Time-to-first-usable-field | giây đến khi có ≥1 field nghiệp vụ đúng |
| Manual salvage rate | % trang phải khoanh tay |
| False “đã đủ chữ” | máy báo full text nhưng thiếu patch ảnh |

Nếu strategy tăng RC nhưng **tăng thời gian chờ** khiến 50 VB/ngày chậm hơn → hạ rank (ưu tiên B).
