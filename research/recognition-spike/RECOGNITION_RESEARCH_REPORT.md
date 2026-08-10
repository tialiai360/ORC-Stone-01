# Recognition Research Report

| Field | Value |
|---|---|
| **ID** | RRS-001-RPT |
| **Spike** | Stone-01 Reborn · Recognition Research |
| **Date** | 2026-07-21 |
| **Status** | Phase-0 report (methodology + provisional findings) · **chưa chốt số đo corpus đầy đủ** |

---

## 1. Câu hỏi nghiên cứu

Không hỏi: «Có nên dùng OCR không?»

Hỏi: **Làm cách nào để Stone đạt Recognition Coverage cao nhất trên PDF ngân hàng thực tế?**

Ràng buộc giá trị:

> Nhân viên 50 công văn/ngày — giải pháp phải giúp **xong việc**, không chỉ đẹp kiến trúc.

## 2. Giả định đã phá sản

| Giả định cũ | Kết quả thực nghiệm quan sát |
|---|---|
| Embedded text đủ | Sai — image text, scan patch, stamp/sig ảnh, overlay |
| «Không có TextLayer = hết việc» | Sai — mực vẫn đọc được bằng mắt |
| Che/ẩn layer = tách Photoshop | Một phần — canvas vẫn giữ mực ảnh |
| Font đổi trên mặt đọc = đủ | Sai — mặt đọc TextLayer **lạc** so với vùng ảnh chữ |

## 3. Phương pháp

1. Định nghĩa metric: RC / VC / BC / KC / UR (`lab/METRICS.md`) — **không** lấy OCR WER làm North Star.  
2. Đặt 8 strategy độc lập A–H (`lab/strategies.ts`).  
3. Dataset đa family (`dataset/DATASET_MANIFEST.md`).  
4. Mỗi strategy: Difference Map + scorecard.  
5. Rank theo **Real User Value × Suitability ORC**, rồi mới xem coverage.  
6. Được phép đổi giả định giữa chừng.

## 4. Phát hiện chính (đến nay)

### 4.1 Khoảng trống nhận thức = Gap Map

Người dùng thấy chữ; Stone chỉ thấy glyph. **Difference (ink − embedded coverage)** là tín hiệu điều khiển recognition — không phải UI.

### 4.2 Full-page OCR không phải tối ưu vận hành

Phủ cao trên giấy nhưng:

- Chậm × 50 VB  
- OCR watermark / chrome → nhiễu gợi ý  
- Xung đột với «Evidence immutable + human gate» nếu dump ồ ạt  

→ Giữ làm **Strategy B baseline lab**, không làm default sản phẩm.

### 4.3 Gap → ROI là đòn bẩy đúng pain

Strategy **D** khớp đúng chỗ clerk thất vọng: «chỗ này nhìn có chữ mà máy không có».

### 4.4 Layout là router, không phải reader

Strategy **E** (và layer harvest hiện có) quyết định *gì cần đọc / gác*, rồi mới gọi D/F.

### 4.5 Hybrid multi-pass là kiến trúc, không phải một API OCR

Strategy **G** = A (nhanh) → E (route) → D/F (lấp lỗ) → specialized → H (lasso/template) + **early exit** khi Business Coverage đủ.

## 5. Kết luận tạm (provisional)

| Hạng mục | Kết luận |
|---|---|
| Đạt ~100% khả năng đọc hiểu? | **Có đường** qua G (hybrid), chưa chứng minh số đo đủ corpus |
| Công nghệ bị cấm? | Không — OCR/Vision/layout/barcode/manual đều được thử trong lab |
| Default sản phẩm hôm nay? | **Ngoài scope spike** — cần Decision sau khi corpus chạy |
| Ưu tiên clerk | D/G/H > B/C; A chỉ baseline |

## 6. Việc còn lại để nâng report khỏi “provisional”

- [ ] Đổ corpus local đủ family  
- [ ] Chạy A–G trên cùng trang; ghi `RESULTS/*.json`  
- [ ] Thay số trong `COMPARISON_MATRIX.md`  
- [ ] Spot-check accuracy ROI (không làm KPI chính)  
- [ ] Đo time-to-first-usable-field trên 10 VB mẫu  

## 7. Liên kết deliverables

- [COMPARISON_MATRIX.md](./COMPARISON_MATRIX.md)  
- [ARCHITECTURE_PROPOSAL.md](./ARCHITECTURE_PROPOSAL.md)  
- [RECOMMENDED_STRATEGY.md](./RECOMMENDED_STRATEGY.md)  
- [REJECTED_STRATEGIES.md](./REJECTED_STRATEGIES.md)  
- [FUTURE_RESEARCH.md](./FUTURE_RESEARCH.md)
