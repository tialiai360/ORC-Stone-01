# EVO002B_DECISION.md

> Date: 2026-07-21  
> Wave: EVO-002b — incremental detectors + modern PDF presentation (AUTHORIZED under EVO-002)

---

## Decision

### **READY WITH CONDITIONS**

### Continue: **AUTHORIZED** for next quality / operator-list / large-doc work (not STOP)

---

## Summary

Incremental delivery on EVO-002 conditions without breaking Absolute Locks:

1. Stronger DOI detectors (QR / barcode / annotation) + safer header/footer rules  
2. AnnotationLayer + DPL annotation primitives (presentation)  
3. Find-in-document + native bookmarks navigation  
4. Continuous-mode spacer virtualization (scroll stability)

## Conditions (still open)

1. Operator-list / vector path extraction still incomplete  
2. Selectable/RO/object 99%+ quality gates not claimed  
3. Find only covers pages already analyzed (corpus cache); not full pre-index  
4. Non-PDF adapters still interface-only  
5. Very large docs: spacer list OK; true windowed virtualization can go further  

## Locks audit

| Lock | Status |
|---|---|
| UX-001 | PASS |
| DIL-001 (no OCR/AI) | PASS |
| KPL-001 | untouched |
| LAB-001 | untouched |
| Raw PDF immutable | PASS |

## Evidence

- Unit: DOI + pdf-find (+ prior suites)
- Typecheck: required green
