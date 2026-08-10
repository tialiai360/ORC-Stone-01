# PRODUCT_ASSUMPTIONS.md

> Stone-01 Product Assumptions catalog  
> Authority: Architecture Review 2026-07-21 (`ARCHITECTURE_REVIEW_RECOGNITION_OBJECTS.md`)  
> Does **not** amend Canonical Laws  
> **Org-wide Living SoT:** [`ASSUMPTION_REGISTER.md`](../../ORC-Knowledge/Architecture/ASSUMPTION_REGISTER.md) (`ASR-*`) — promote important items; Evolution / Board use ASR IDs  

---

## Separation

| Layer | Change control | Examples |
|---|---|---|
| **Canonical Law** | Knowledge / CAO only | Raw immutable · human-governed Knowledge · Evidence attribution |
| **Product Assumption** | Stone ADR / EVO Decision · **register as ASR when important** | Which Recognition Sources are enabled |
| **Lab Condition** | That lab’s Decision only | DIL-001: no OCR *in that lab* |

---

## Catalog

| ID | ASR map | Statement | Status | Notes |
|---|---|---|---|---|
| PA-01 | [ASR-013](../../ORC-Knowledge/Architecture/ASSUMPTION_REGISTER.md#asr-013) | Stone-01 only supports embedded text | **SUPERSEDED** → ASR Deprecated | Replaced by PA-01b |
| PA-01b | [ASR-005](../../ORC-Knowledge/Architecture/ASSUMPTION_REGISTER.md#asr-005) | Stone-01 supports enabled Recognition Sources emitting Recognition Objects | **PROPOSED** | Default source remains embedded-text |
| PA-02 | — | No TextLayer ⇒ product dead | **SUPERSEDED** | Becomes explicit source-gap |
| PA-03 | [ASR-013](../../ORC-Knowledge/Architecture/ASSUMPTION_REGISTER.md#asr-013) | No OCR/AI forever in product | **SUPERSEDED** | OCR optional under capability + confirm gate |
| PA-03b | [ASR-007](../../ORC-Knowledge/Architecture/ASSUMPTION_REGISTER.md#asr-007) | Machine Recognition never auto-ingests Knowledge | **ACTIVE** (restates Canonical human gate) | ASR Validated |
| PA-04 | — | Pipeline center = Embedded Text / DOM | **SUPERSEDED** | Center = Recognition Object graph |
| PA-05 | [ASR-014](../../ORC-Knowledge/Architecture/ASSUMPTION_REGISTER.md#asr-014) | Knowledge may consume provider dumps | **INVALID** → ASR Rejected | Only confirmed Recognition Objects |
| PA-06 | [ASR-003](../../ORC-Knowledge/Architecture/ASSUMPTION_REGISTER.md#asr-003) | Raw PDF may be rewritten by OCR | **FORBIDDEN** (Canonical) | ASR Validated (immutability) |

---

## Default enablement (until EVO-012 Decision)

| Capability | Enabled | Related ASR |
|---|---|---|
| Embedded text | Yes | ASR-005 |
| Layout / Rules (existing engines) | Yes (as recognition producers) | ASR-009 (UX harvest) |
| OCR / Vision | No | ASR-006 |
| Human Annotation (as RO source) | Partial (assign path) | ASR-007 |

---

## Document updates pointer

See Architecture Review §7. Status changes that matter org-wide → update **ASSUMPTION_REGISTER** in the same change.
