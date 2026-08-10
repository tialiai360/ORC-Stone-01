# Product Review — Layout Layer Harvest (MVP)

> **Feature:** Layout Layer Harvest  
> **Date:** 2026-07-21  
> **Reviewer:** Product architecture pass (Constitution · Manifesto · Checklist · AFH Ch.21)  
> **Evidence basis:** Code + design intent (telemetry not yet live — mark assumptions)  
> **Outcome:** **REDESIGN** (keep direction; fix ship blockers before treating as “done”)

---

## Checklist answers

### 1. Disappearance test

**Would the user notice if it disappears?**

- **Conditional YES** if layers populate and they use Giữ/Không dùng / Nhận theo lớp.  
- **Risk of NO** if panel often shows “Chưa tách được lớp” → feature invisible → Checklist says delete.

**Verdict:** Pass only when ≥1 useful layer appears on typical HO PDFs. Otherwise treat as dead UI.

---

### 2. Clicks

**Reduce clicks?** Mixed / **not proven**.

| Before (approx) | After (approx) |
|---|---|
| Fight WM on canvas, open Dev panels, toggle modules | Open layer → Discard WM (1) → expand → Nhận hints (n) |

- Adds: per-layer 3 disposition buttons + focus click.  
- Saves: hunting chrome / wrong selection.  
**Assumption (needs Telemetry):** net click↓ on BIDV-class docs.  
**Status:** Observed — enter metrics when UX Telemetry ships.

---

### 3. Thinking

**Reduce thinking?** Partial **YES**.

- Clarifies decision: *Giữ / Không dùng lớp* vs “module kỹ thuật nào đang bật?”.  
- Still costs thinking: 3 states (Giữ / Không dùng / Xem lại) + list cạnh Work Brief.

**Manifesto Law 4:** consider default-only + one “Không dùng” for chrome, hide Review unless needed.

---

### 4. Reading

**Reduce reading?** Partial **YES** when discard chrome works.

- Intent: less noise → less full-page re-read.  
- Gap: chưa “chỉ hiện một lớp” như tờ trong suốt → reading benefit weaker than AFH Ch.21 promise.

---

### 5. Typing

**Reduce typing?** **YES** when hints fire.

- Path: layer hint → Nhận (suggest→confirm).  
- Matches Manifesto Law 4 / Constitution P1.

---

### 6. Stay in ORC

**YES** — harvest + confirm stays in workspace; no Word required for this path.

---

### 7. First-time clarity

**WEAK — redesign needed.**

- Labels “Lớp layout”, “Xem lại” are product jargon-ish.  
- Empty state doesn’t teach next step (“mở trang…” soft).  
- Two competing surfaces: Lớp layout + Work Brief gợi ý (duplicate Nhận).

**Manifesto Law 5 / 8:** one primary action per moment — today two suggestion streams.

---

### 8. Organizational knowledge

**YES** (when Nhận).

- Writes ClassificationAssignment / dossier fields (căn cứ, biểu mẫu, trích yếu…).  
- Disposition itself not yet persisted as Memory — **gap for Evolution Candidate**.

---

### 9. Future Stones

**PARTIAL.**

- Feeds Knowledge that Stone-02 can consume later.  
- Does **not** yet emit Suggested Actions / Package / Action Readiness (AFH W6+).  
Acceptable for MVP slice if framed as Knowledge fuel only.

---

### 10. 10× scale, UI still simple?

**AT RISK — redesign constraint.**

- 10 layer kinds × many pages × many hints → right rail overload.  
- Need: collapse chrome, auto-apply defaults, show only exceptions + top hints.

**Manifesto Law 3:** hide complexity.

---

### 11. Foundation safety

**YES — PASS.**

- Derives from existing regions/modules; no Foundation rewrite; Evidence immutable.

---

### 12. Completeness without it

**YES, ORC still feels complete** (Brief + suggest already existed).

- Combined with Q1 risk → feature must become **noticeably better path**, not optional chrome, or it fails disappearance test.

---

### 13. Personal daily use

**YES**, for HO notices — if layers reliable: Discard WM/signature, Nhận căn cứ/bảng theo lớp.

If layers empty on real bank PDFs → **NO** → customers shouldn’t be asked to use it either.

---

### 14. Real vs technical problem

**REAL work problem.**

- “Đừng để chrome cản đọc/ghi kiến thức; quyết giữ/bỏ theo mặt phẳng.”  
- Not merely “show moduleId list prettier.”

---

### 15. Simpler solution?

**Explored.**

| Alternative | Verdict |
|---|---|
| Chỉ «Chỉ nội dung» (ẩn chrome) | Simpler for reading; **weaker** for per-plane Knowledge |
| Dev structure panel only | Violates User Value / hide complexity |
| Layout Layer + defaults + Nhận | Chosen — justify by Knowledge-per-layer |

Simpler **reading-only** exists; simpler **Knowledge-from-plane** does not. Keep, but simplify UI.

---

## Constitution / Manifesto spot-check

| Principle / Law | Fit |
|---|---|
| P1 User Value First | Intent OK; UX still technical |
| P3 Business Understanding | Layer → meaning → Knowledge: OK direction |
| P9 Minimal Interaction | Extra panel + 3 buttons: debt |
| P10 Knowledge → Action | Not yet |
| Manifesto Law 2 (experience not features) | Borderline “feature panel” |
| Manifesto Law 7 (shortest) | Duplicate gợi ý Brief vs Layer |

---

## Outcome

| Field | Value |
|---|---|
| **Outcome (MVP)** | **REDESIGN** |
| **Follow-up (2026-07-21)** | **REDESIGN implemented** — see below |
| **Not** | DELETE (real problem) / BLOCK (Foundation OK) |

### Must-fix before “Accepted / Validated”

1. **Empty layers:** hide panel or show one CTA; never dead chrome.  
2. **Defaults:** auto-apply Discard for watermark/signature; don’t force 3-way choice every time.  
3. **One suggestion stream:** Layer Nhận feeds Brief (or Brief suppressed duplicates).  
4. **Language:** business labels (“Phần không cần đọc”, “Phần nội dung chính”) over “Lớp layout”.  
5. **Persist disposition** into session/Package draft (organizational memory of keep/discard).  
6. **Reality Validation:** after telemetry, measure Evidence Dependency Ratio + Correction Count with/without feature.

### Redesign shipped (code) — 2026-07-21

| Must-fix | Status |
|---|---|
| 1 Empty → hide panel | Done — `LayoutLayerPanel` returns `null` |
| 2 Auto-discard chrome + 2-way UI | Done — WM/sig/footer/image discard; header theo hints; **Dùng để đọc / Bỏ khỏi đọc** |
| 3 One suggestion stream | Done — hints only in Work Brief; layer panel no longer has Nhận |
| 4 Business labels | Done — e.g. «Phần không cần đọc (watermark)» |
| 5 Persist disposition | Done — `sessionStorage` keyed by `documentId` + seed defaults |
| 6 Reality Validation | Still open (needs telemetry) |

**Next gate:** Product Review re-pass after real HO PDF use; then Telemetry Validation.

### Evolution Candidate (draft)

- **Title:** Simplify Layout Layer Harvest UX  
- **Status:** Observed → Implemented (pending Validated)  
- **Affected Layer:** UX + Knowledge model (disposition persistence)  
- **Evidence:** This Product Review (pre-telemetry)  
- **Next:** Product Review after redesign; then Telemetry Validation  

---

*Product Review record · Layout Layer Harvest MVP · 2026-07-21 · redesign follow-up same day*
