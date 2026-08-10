# EVO002B_CHANGELOG.md

## 2026-07-21 — PDF modern UX + DOI detectors (Absolute Locks)

### Added

- **Find-in-PDF** (`Ctrl+F` / nút Tìm) — tìm trên TextLayer corpus, overlay trình bày, không OCR
- **Native PDF bookmarks** — `pdf.js getOutline()` → panel Mục lục (Bookmarks PDF)
- **AnnotationLayer** bật (presentation) — link/form; CSS không chặn chọn chữ
- **DPL annotation primitives** từ AnnotationLayer DOM
- **DOI detectors:** `det.qr.v1`, `det.barcode.v1`, `det.annotation.v1`
- **Capabilities:** `ocap-qr`, `ocap-barcode`, `ocap-annotation`
- **Continuous virtualization** — spacer chiều cao cache cho trang ngoài window (ổn định scroll)

### Fixed

- Header/footer DOI: không còn gắn mọi chữ top/bottom band; chỉ running chrome ngắn / số trang / cue
- Image detector ternary chết (proxy luôn `photo`) — dọn sạch
- Page window continuous: maxSpan 7 + spacer slots (giảm nhảy scroll khi trim window)

### Not changed (locks)

- UX-001 shortcuts / pen colors
- DIL / KPL / LAB
- No OCR / AI / LLM
- Raw PDF immutable

### Flag

- DOI: `localStorage orc.intel.doi.v1` (`0` = tắt)
- Engine: `doi-engine/1.1.0`
