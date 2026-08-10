# Product Vision — Knowledge Library & Stone Roadmap

> Captured from Product Owner intent · 2026-07-21  
> Does not authorize OCR code · Does not mutate Foundation  

---

## What Stone-01 must become

**Not:** a viewer that shows the imported file as-is.  
**Yes:** a **Business Reading Engine** that **separates** the document into **Knowledge fields** so the organization builds a **large, structured document library**.

### Knowledge dossier (examples)

| Field | Knowledge node (Stone-01) |
|---|---|
| Tên / loại / số VB | `loai-van-ban`, `so-van-ban`, `thong-tin-van-ban` |
| Ngày tháng / hiệu lực | `ngay-ban-hanh`, `hieu-luc` |
| Chủ đề / trích yếu | `trich-yeu` |
| Đối tượng / nơi nhận / phối hợp | `doi-tuong`, `noi-nhan` |
| Nội dung / yêu cầu | `noi-dung`, `yeu-cau` |
| Người ký | `nguoi-ky` |
| Thời hạn | `thoi-han` |
| Căn cứ / VB liên quan / biểu mẫu | `can-cu`, `van-ban-lien-quan`, `bieu-mau` |

Everything visible that matters for work should be **separable into Knowledge**. Humans refine until retrieval is perfect.

### User experience doctrine

- **Few buttons, modern, calm** — User mode shows the **Knowledge dossier**, not detector panels.  
- **Deep edit** always available: correct recorded Knowledge so the library stays trustworthy.  
- Document canvas stays for **evidence of where a fact came from** — not the primary “product surface”.

---

## Why this matters later (Stone-2 / Stone-3)

| Stone | Role (evolutionary) |
|---|---|
| **Stone-01** | Separate → Knowledge library + evidence + human refine |
| **Stone-02+** | **Re-issue to branches**: pull body/fields from original Knowledge, staff edits wording only, pick branch signer → publish. Simple drafting — not a full Word clone. |
| Later | Routing, case files, calendars — consume the library |

Without Stone-01 separation, Stone-2 has nothing clean to reuse.

---

## Full-document separation & image text

- **Goal:** everything that appears and matters can be separated into Knowledge.  
- **Image / scan → text:** required for professionalism; delivered only via **authorized Recognition Source** Decision (see Architecture Review) — not by rewriting Foundation.  
- Until then: embedded-text documents get full dossier UX; scans show an honest gap + path to annotate when possible.

---

## Immediate Stone-01 slice

**Work Brief / Hồ sơ kiến thức** in User mode:

1. One list of Knowledge fields (filled / empty).  
2. Click empty → arm pen → select on document.  
3. Inline edit confirmed text.  
4. Jump to page evidence.  
5. Hide recognition chrome.

Success = staff sees **why ORC helps**: structured data for the library, not a second copy of the PDF.
