# EVO002C_DECISION.md

> Date: 2026-07-21  
> Wave: EVO-002c — Input Provider Architecture (no derived-text implementation)

---

## Decision

### **READY WITH CONDITIONS**

### Continue: **AUTHORIZED** for primitive-first Find/Selection hardening (not STOP)

---

## Summary

Stone Runtime extraction path is provider-agnostic:

- `IInputProvider` + Capability Registry + Input Runtime DI
- Only `cap.input.embedded-text` / `provider.pdf-text.v1` enabled
- DOI no longer hardcodes PDF TextLayer adapter
- Provenance required on extracted text primitives
- Foundation / Knowledge / Review / Evidence schemas untouched
- No derived-text provider, libraries, or capability slots declared

## Locks / principles

| # | Principle | Result |
|---|---|---|
| 1 | Zero engine vocabulary in contracts | PASS (no OCR capability id) |
| 2 | Tech-independent provider | PASS |
| 3 | Future text source = new provider | PASS (architecture) |
| 4–6 | Foundation / Knowledge / Review | PASS (untouched) |
| 7 | Evidence deterministic | PASS (snapshot path unchanged) |
| 8 | Raw immutable | PASS |
| 9 | Provenance | PASS (TextPrimitive + DPL) |
| 10 | Business ≠ provider impl | PASS for DOI extract; Find DOM assist deferred |

## Conditions

1. Find match boxes still probe page DOM spans (presentation assist) — corpus is provider text.
2. Legacy `InputAdapter` bridge remains until call-sites fully drop.
3. Derived-text provider not implemented / not registered.

## Errata (2026-07-21)

Product Assumption “only embedded text” is **superseded** as a *product ceiling* (see `ARCHITECTURE_REVIEW_RECOGNITION_OBJECTS.md`).  
This Decision’s **architecture** (provider-agnostic extract) remains valid and is the compatibility spine.  
OCR / derived-text **implementation** still not authorized by EVO-002c.

## Evidence

- Unit: `input-provider.test.ts` + prior DOI/pipeline suites
- Docs: `INPUT_PROVIDER_ARCHITECTURE.md`, `INPUT_PROVIDER_MIGRATION.md`
