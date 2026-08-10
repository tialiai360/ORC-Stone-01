# EVO001_REVIEW.md

> **EVO-001** — Workbench evolution review  
> Date: 2026-07-18

---

## What changed

| Area | Change |
|---|---|
| Layout | `WorkbenchShell` — 3 cột, resize, collapse Outline/Knowledge |
| Modes | + **Focus**; mode bar Workbench; chrome rút gọn |
| Outline | Trang · cấu trúc pháp lý · lịch sử điều hướng |
| Knowledge UI | `KnowledgeWorkspace` — Tiến độ / Thiếu / Ánh xạ |
| DPK bridge | `dpk/module-map.ts` + legal detector (Điều/Khoản/Điểm/…) |
| Selection | `structureRef` trên assignment (block/region/module/dpkClass) |
| Structure panel | Đổi tên **Cấu trúc tài liệu**; tooltip DPK |
| Dead code | Removed unused `knowledge-sidebar.tsx` |

---

## Locks verified

| Lock | Status |
|---|---|
| UX-001 pens/colors/Ctrl+1–9/Esc/`?` | Intact |
| Similar YES/NO never auto | Intact |
| No OCR/AI/LLM | Intact |
| Raw PDF immutable | Hide/Show presentation only |
| DIL-001 / KPL-001 | Untouched |

---

## Residual gaps (next tranche)

- Continuous multi-page scroll / virtualization  
- True page mini-map thumbnails  
- Deeper Subject/NationalTitle band split inside header  
- Full VR-* validation panel  
- Claim “DPK-001 complete” — **not** made  

---

## Quality notes

- Architecture clearer: `workbench/` · `knowledge/` · `dpk/`  
- Document canvas maximized in Focus  
- Knowledge progress visible without tree-first UX  
