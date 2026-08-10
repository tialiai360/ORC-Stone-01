# Product Gate — Accuracy Before Batch Auto

> Product Owner intent · 2026-07-21  
> **If batch auto extraction is wrong at scale, Stone is abandoned.**

---

## The real job of Stone-01

1. **Separate** document facts into Knowledge fields **accurately**.  
2. Make **correction cheap** (faster than re-reading / re-typing).  
3. Only then allow **batch import + one-click auto**.

Automation without (1)+(2) destroys trust permanently.

---

## Hard product gates (evolutionary)

| Gate | Rule | Fail means |
|---|---|---|
| **G1 — Field accuracy** | Auto/suggested values for core fields (số VB, ngày, trích yếu, hạn, người ký, nơi nhận…) must be measurable and improving | No batch auto |
| **G2 — Cheap edit** | Wrong field: open → fix text → save in ≤ few clicks, with jump to evidence | No batch auto |
| **G3 — Confirm before library** | Nothing enters the durable Knowledge library as “trusted” without human confirm (or sampled audit with explicit policy) | No silent library write |
| **G4 — Batch kill-switch** | Batch auto ships behind a flag; if error rate exceeds threshold, auto stops and falls back to assisted mode | Protect trust |
| **G5 — Provenance** | Every auto field shows source/confidence; user sees *why* | Blind trust forbidden |

**Canonical unchanged:** raw document immutable · Evidence principles · Foundation untouched.

---

## Sequence (do not invert)

```
Accurate separation  →  Easy correction  →  Assisted suggest
        ↓
   Measured quality
        ↓
   Batch auto (Stone wave when G1–G5 pass)
        ↓
   Stone-2 re-issue consumes trusted library
```

**Forbidden order:** batch auto first “to save time”, then fix quality later.

---

## What “accurate separation” means here

Not “pretty PDF view”.  
It means: for each Knowledge field, the value in the dossier matches the document (or is empty / low-confidence — never confidently wrong).

Core fields for gate metrics (minimum set):

- `so-van-ban`, `ngay-ban-hanh`, `trich-yeu`  
- `don-vi-ban-hanh`, `doi-tuong` / `noi-nhan`  
- `nguoi-ky`, `thoi-han`  
- `yeu-cau` / `noi-dung` (may be multi-span; accuracy = no wrong attribution)

---

## What “easier edit” means

- Dossier-first UI (already started: Hồ sơ kiến thức)  
- One field → see evidence page → edit text → save  
- Suggest ≠ commit (user accepts)  
- Bulk wrong run must be **revertible** (session / evidence), not baked into library

---

## Implication for OCR / image text

Needed for coverage of all docs, but **same gates**:  
OCR text that is wrong and auto-committed kills Stone the same way.  
OCR = Recognition Source under G3–G5, not a bypass.

---

## Stone-01 near-term work (authorized direction)

1. Improve **suggest → confirm** quality for core fields (rules / patterns / DOI hints — human confirm).  
2. Harden **edit** path until correction is obviously cheaper than ignoring Stone.  
3. Define **error-rate dashboard** (even manual sampling) before any batch button.  
4. **No** “chạy tự động hàng loạt” button until Decision records G1–G5 pass.

---

## One-line doctrine

> **Stone earns the right to automate only after humans trust its separations and can fix mistakes faster than working without it.**
