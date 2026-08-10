# Rejected Strategies (as defaults / standalone)

| Field | Value |
|---|---|
| **ID** | RRS-001-REJ |
| **Note** | “Rejected” = không chọn làm **default / standalone**. Vẫn giữ trong lab để đo baseline. |

---

## Rejected as product default

| ID | Strategy | Lý do reject default | Giữ để |
|---|---|---|---|
| **A alone** | Embedded only | Coverage thất bại trên PDF thực tế ngân hàng | Baseline delta |
| **B alone** | OCR full page | Chậm × 50 VB; nhiễu chrome; ORC dump risk | Lab ceiling / scan pages |
| **C alone** | Text+OCR merge | Chi phí ~B; merge phức tạp; lợi ích biên so D thấp (giả thuyết) | So sánh merge quality |
| **E alone** | Layout first | Layout ≠ chữ; không đọc image text | Router trong G |
| **F alone** | Seg→OCR | Thiếu embedded-first; dễ OCR thừa | Stamp/sig path trong G |

## Not rejected (composition)

| ID | Vai trò trong khuyến nghị |
|---|---|
| D | Core lấp gap |
| G | Kiến trúc tổng |
| H | Last mile clerk |

## Rejected mindsets (quan trọng hơn reject engine)

| Mindset | Reject vì |
|---|---|
| «OCR accuracy là KPI sản phẩm» | Lệch North Star ORC; clerk không chấm WER |
| «Phải OCR mọi trang cho RC max» | Giảm tốc độ 50 VB/ngày |
| «Cấm OCR mãi» | ASR-013 đã deprecated; thực tế cần nguồn khác |
| «Kiến trúc đẹp hơn UX chậm» | Vi phạm Real User Validation của spike |

## Reversible

Mọi reject ở đây **đảo được** nếu corpus chứng minh ngược (ví dụ 80% trang pure scan → B trong G nặng hơn). Không bảo vệ bảng này bằng ego.
