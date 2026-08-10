# INPUT_PROVIDER_ARCHITECTURE.md

> Stone-01 Runtime — Input Provider Architecture  
> Date: 2026-07-21  
> Scope: Stone Runtime only · No Foundation / Knowledge / Review mutation  
> No derived-text provider implementation in this wave

---

## Errata (2026-07-21) — Product Assumption update

**Superseded Product Assumption:** “Stone-01 only supports embedded text.”

**Replacement:** Embedded text is the **default enabled Recognition Source**, not the product ceiling.  
See: `ARCHITECTURE_REVIEW_RECOGNITION_OBJECTS.md`, `PRODUCT_ASSUMPTIONS.md`.

Canonical Laws (raw immutable · human confirm → Knowledge · Evidence principles) are **unchanged**.  
OCR / Vision remain **not implemented** here; future sources require authorized EVO Decision.

This document’s contracts (`IInputProvider`, `TextPrimitive`, provenance, registry) remain the **compatibility spine** for Recognition Object adapters.

---

## Principles

1. Stone Runtime has **zero** technology-engine vocabulary in contracts (no vendor/engine branching).
2. Providers are technology-independent behind `IInputProvider`.
3. A future derived-text / OCR provider is added **only** as a new provider + registry registration (authorized wave).
4. Foundation / Canonical Laws unchanged.
5. Knowledge Runtime unchanged.
6. Review Package format unchanged.
7. Evidence remains snapshot-based at assign time (deterministic export).
8. Raw document bytes immutable.
9. Every extracted text unit carries **provenance**.
10. Business logic (DOI / Region / Selection) consumes **Text/DPL primitives**, not provider internals.

---

## Pipeline

```
DocumentInput (opaque context)
    ↓
Capability Registry (enabled providers only)
    ↓
IInputProvider.extractText()
    ↓
TextPrimitivePage (+ provenance)
    ↓
DPL bridge / Normalization
    ↓
DOI → Region → Reading Order → Selection → Evidence snapshot
```

*(Target evolution: TextPrimitivePage ⊆ Recognition Object graph — see Architecture Review. Not implemented in this file’s original wave.)*

---

## Contracts

| Type | Role |
|---|---|
| `IInputProvider` | `canProcess` · `extractText` |
| `TextPrimitive` / `TextPrimitivePage` | Unified text model |
| `TextProvenance` | source · providerId · providerVersion · confidence · page · bbox? · engine? |
| `InputCapabilityRegistry` | register / resolve |
| `InputRuntime` | DI façade |

Capability id today: **`cap.input.embedded-text`** → `provider.pdf-text.v1` (enabled).

No OCR capability enabled. Future capability ids are capability-oriented (see Architecture Review), not engine names.

---

## Enabled provider

**PDF Text Provider** (`provider.pdf-text.v1`)

- Reads embedded page text (precollected geom or page DOM — **private** to provider)
- Emits `source: embedded-text`, `confidence: 1`
- Does not mutate raw PDF

---

## Non-goals (this wave)

- Implementing any derived-text / vision engine
- Adding engine libraries or dependencies
- Changing Evidence / Review / Foundation schemas
- Teaching DOI about provider class names

---

## Paths

```
apps/web/src/features/workspace/pdf/intelligence/input/
  types.ts
  provider.ts
  capability-registry.ts
  create-default-registry.ts
  runtime.ts
  bridge-to-dpl.ts
  providers/pdf-text-provider.ts
```
