# Architecture Review — Recognition Objects (Stone-01)

> **Date:** 2026-07-21  
> **Status:** REVIEW COMPLETE — **implementation NOT authorized** until Decision wave  
> **Trigger:** Operational document validation invalidated the Product Assumption *“Stone-01 only supports embedded text”*  
> **Hard boundaries:** Do **not** modify Foundation · Knowledge Runtime · Evidence **principles** · Canonical Laws text in this review  

---

## 0. Executive verdict

| Question | Answer |
|---|---|
| Is “embedded text only” a Canonical Law? | **No** — it is a **Product Assumption** (and historically conflated with DIL-001 lab scope). |
| Can Stone-01 cover scan / image-only docs without mutating Foundation? | **Yes** — via **Recognition Sources → Recognition Objects → human confirm → Knowledge**, using existing Input Provider / provenance spine. |
| May we enable OCR inside Stone-01 today? | **No** — not until an authorized EVO Decision; this pack is architecture only. |
| What stays absolute? | Raw bytes immutable · human confirmation before Knowledge ingestion · Evidence provenance · no silent Foundation / Knowledge Runtime schema rewrite. |

**Recommended posture:** Treat Stone-01 Runtime as a **Recognition Substrate**. Embedded text remains the **default enabled source**. OCR, Vision, Layout Detection, Rule Engine, and Human Annotation become **optional Recognition Sources** behind capability registry. Downstream Knowledge continues to consume only **confirmed Recognition Objects** (not engine dumps).

---

## 1. Separate Canonical Laws from Product Assumptions

### 1.1 Canonical Laws (immutable here — do not rewrite in Stone)

These are **org / Foundation / governance truths**. Stone Runtime must **obey**, not redefine:

| Canonical theme | Meaning for Stone | Home (Knowledge) |
|---|---|---|
| Raw document immutability | Never rewrite PDF/DOCX bytes to “add OCR text” | DIL / DPK governance · Absolute Locks |
| Knowledge is human-governed | No silent auto-ingest of unverified machine text into Knowledge | UX-001 / DIL human gate · KPL lineage |
| Evidence is attributable | Assignments / corrections carry provenance & snapshot semantics | Evidence principles (unchanged) |
| Foundation / Ontology freeze | No casual mutation of Canonical Law texts or Ontology spine | `ORC_CANONICAL_LAWS` · Freeze ADRs |
| Presentation ≠ Knowledge | Geometry / overlays ≠ Knowledge units | EVO-007 separation already in Stone |

**Non-law (must not be treated as Canonical):**

- “Only embedded PDF text exists”
- “OCR is forever forbidden in the product”
- “Image-only documents are out of scope forever”

Those were **lab / Stone Product Assumptions** (DIL-001 condition *“No OCR from this lab”*, EVO-002c *only `cap.input.embedded-text` enabled*, DPK *image-only deferred*). They protected Phase-0 integrity; they are **not** physics and **not** Canonical Laws.

### 1.2 Product Assumptions — current (invalidated) vs target

| ID | Current (invalidated by ops) | Target (capability-oriented) |
|---|---|---|
| PA-01 | Stone-01 only supports embedded text | Stone-01 supports **any enabled Recognition Source** that emits Recognition Objects |
| PA-02 | No text layer ⇒ no product value | No text layer ⇒ **source gap**; other sources or human annotation may fill |
| PA-03 | “No OCR/AI” = Absolute product forever | “No OCR/AI **until authorized capability + governance**” |
| PA-04 | Pipeline center = PDF TextLayer / DOM | Pipeline center = **Recognition Object graph** |
| PA-05 | Knowledge may see provider-specific text | Knowledge Runtime accepts **only confirmed Recognition Objects** (stable contract) |

### 1.3 Separation rule (normative for future Stone docs)

```
Canonical Law     → MUST NOT change in Stone EVO docs; cite Knowledge.
Product Assumption → MAY change via Stone ADR / EVO Decision; MUST NOT be labeled “Absolute Lock”
                     unless it is a restatement of a Canonical Law.
Lab Condition      → Scoped to that lab (e.g. DIL-001); does not permanently redefine product scope.
```

---

## 2. Capability-oriented assumptions (replace technology-specific ones)

### 2.1 Banned vocabulary in *contracts* (keep)

Contracts must remain free of vendor/engine names (`tesseract`, `paddle`, specific cloud OCR APIs) — consistent with EVO-002c.

### 2.2 Allowed vocabulary in *capabilities*

| Capability family (illustrative ids) | Role | Default in Stone-01 today |
|---|---|---|
| `cap.recognition.embedded-text` | Extract embedded glyphs / TextLayer | **Enabled** (`provider.pdf-text.v1`) |
| `cap.recognition.layout` | Region / band / structure heuristics | Partially present (Region Engine / DPK mapping) — treat as source of **layout** Recognition Objects |
| `cap.recognition.rules` | Deterministic detectors (DOI, stamps, QR cues) | Present (rule engines) — emit objects, not Knowledge |
| `cap.recognition.ocr` | Raster → text + bbox + confidence | **Disabled** until Decision |
| `cap.recognition.vision` | Non-text visual classes (seal/photo) without claiming Knowledge text | **Disabled** until Decision |
| `cap.recognition.human` | Human Annotation / correction as first-class source | Partially present (assign / correction UX) — elevate to source |

**Assumption rewrite:**

> Stone-01 value depends on **Recognition coverage**, not on a single extraction technology.  
> Coverage = union of enabled sources, each carrying provenance.  
> Gaps are explicit (`source-gap`, `scanned-page`, `low-confidence`) — not silent failure.

### 2.3 Relationship to existing Input Provider

EVO-002c already introduced:

- `IInputProvider` · `TextPrimitive` · `TextProvenance` · Capability Registry  
- `TextSourceKind` already includes `'derived-text'` in DPL types  

**Recognition Objects** generalize that spine: text is one *kind* of recognition payload; layout and visual classes are siblings. Embedded-text provider becomes **one Recognition Source adapter**, not the architecture center.

---

## 3. Target architecture — Recognition Objects (not Embedded Text)

### 3.1 Recognition Object (conceptual contract)

A **Recognition Object** is a Stone Runtime unit of understanding *before* Knowledge:

| Field (conceptual) | Intent |
|---|---|
| `id` | Stable-enough runtime id |
| `kind` | `text` · `region` · `visual` · `annotation` · … |
| `page` · `bbox` | Localization (presentation + evidence geometry) |
| `payload` | Text and/or class label / structure role |
| `confidence` | Source-declared [0..1] + level |
| `provenance` | source capability · providerId · version · optional engine tag (provenance only) |
| `status` | `proposed` · `confirmed` · `rejected` · `superseded` |
| `links` | Optional relations to other Recognition Objects |

**Laws of motion:**

1. Sources **propose** Recognition Objects (`status: proposed`).  
2. Humans (or an authorized confirm policy that still requires human for Knowledge) **confirm / reject / reclass**.  
3. **Only `confirmed` Recognition Objects** may cross into Knowledge Runtime ingestion paths.  
4. Evidence snapshots bind to confirmed objects + human action time (Evidence principles unchanged).  
5. Raw document bytes never rewritten by sources.

### 3.2 Recognition Sources (optional)

```
                    ┌─────────────────────────────┐
                    │     Recognition Runtime      │
                    │  (registry · resolution ·    │
                    │   governance · fusion)       │
                    └─────────────┬───────────────┘
                                  │ proposes
         ┌──────────┬─────────────┼─────────────┬──────────┐
         ▼          ▼             ▼             ▼          ▼
   Embedded     Layout         Rules          OCR*      Vision*
     Text      Detection      Engine                    (+ Human Annotation)
         │          │             │             │          │
         └──────────┴─────────────┴─────────────┴──────────┘
                                  │
                                  ▼
                    Recognition Object Graph
                                  │
                    human confirm (mandatory → Knowledge)
                                  ▼
                         Knowledge Runtime
                    (unchanged contract surface)
```

\*OCR / Vision: optional, disabled until authorized Decision.

### 3.3 Why this redesign (ops-driven)

| Ops reality | Embedded-text-only assumption | Recognition Objects |
|---|---|---|
| Scan / image PDF | Dead workspace | OCR source or Human Annotation source |
| Hybrid PDF (partial text) | Partial / confusing | Multi-source merge with provenance |
| Need “all documents” | Product false promise | Capability coverage + explicit gaps |
| Trust / audit | Opaque TextLayer | Provenance + confirm gate |

### 3.4 What does **not** change

- Foundation / Canonical Laws / Ontology texts  
- Knowledge Runtime **implementation** and pack schemas (only the **input boundary** is clarified: confirmed Recognition Objects)  
- Evidence **principles** (snapshot, attribution, no silent rewrite)  
- UX-001 highlighter binding semantics for confirmed assignments  
- Existing `provider.pdf-text.v1` path (backward compatible — see §5)

---

## 4. Human confirmation (mandatory before Knowledge ingestion)

### 4.1 Normative rule

> **No Recognition Object with `status ≠ confirmed` may create or mutate Knowledge assignments / Knowledge Pack verified content.**

This preserves UX-001 / DIL human-gate intent even when OCR/Vision exist.

### 4.2 Allowed without Knowledge ingest

- Presentation overlays (proposed boxes)  
- Developer diagnostics  
- Progressive Learning *suggestions* (local)  
- Capability / Recognition Map UI  

### 4.3 Confirm surfaces (existing + future)

| Surface today | Maps to |
|---|---|
| Pen assign / FloatingHint assign | Human confirm → Knowledge |
| StructureCorrected evidence | Human correction lineage |
| Recognition Human Correction (DOI reclass) | Presentation/progressive — **must not** auto-ingest Knowledge until wired through confirm contract |

Future OCR text must follow the **same** confirm path (assign or explicit “Accept into Knowledge”), never auto-fill Knowledge nodes.

---

## 5. Compatibility analysis

### 5.1 Backward compatibility (required)

| Existing asset | Compatibility strategy |
|---|---|
| `provider.pdf-text.v1` / `cap.input.embedded-text` | Keep enabled; alias as Recognition Source `embedded-text` |
| `TextPrimitive` / DPL bridge | Treat as Recognition Object `kind: text` adapter (shim) |
| DOI / Region / detectors | Continue as Rule / Layout sources emitting objects |
| Selection / Find on embedded corpus | Unchanged when embedded source present |
| Assignments / Evidence export | Unchanged schema; optional future fields additive only |
| User vs Developer audience UX | Remains; OCR UI only under Developer + authorized flag |

### 5.2 Breaking changes to **avoid**

- Renaming Knowledge APIs  
- Requiring OCR libraries in default install  
- Making `derived-text` auto-enabled  
- Writing OCR output into PDF bytes  
- Auto-Knowledge from OCR without confirm  

### 5.3 Alias / migration of capability ids

| Legacy | Target |
|---|---|
| `cap.input.embedded-text` | `cap.recognition.embedded-text` (alias both during migration) |
| `TextSourceKind: derived-text` | Map to OCR/vision-derived Recognition Source kinds without deleting enum value |

---

## 6. Migration impact

### 6.1 Runtime (Stone-01 code — future waves only)

| Area | Impact | Risk |
|---|---|---|
| Input / Recognition registry | Extend; do not replace embedded provider | Low |
| Pipeline (`runDocumentStructurePipeline`) | Consume Recognition Object graph; keep TextPrimitive bridge | Medium |
| PdfViewer empty-text UX | Explicit “no embedded text — enable source / annotate” | Low |
| Knowledge assign path | Gate on confirmed objects | Medium (must not break current assign) |
| Evidence | Additive provenance fields only if needed | Low if additive |
| Tests | Golden: embedded-only docs still pass bit-for-bit behavior | Required |

### 6.2 Knowledge (docs only — **no Runtime code in this review**)

| Doc / pack | Required update type |
|---|---|
| DPK-001 LAYOUT “Image-only deferred” | Replace with capability-oriented deferral + Recognition Object pointer |
| DPK-001 GOVERNANCE “DIL-001 No OCR/AI” | Clarify: **lab lock / confirm gate** vs permanent product ban; OCR as optional source under governance |
| DIL-001 Decision / scorecards | Errata note: condition was lab-scoped; product assumption superseded by this review + future Decision |
| Architecture ProductRealization Stone-01 | Point to Recognition Object model when Decision locks |

**Do not** edit Canonical Law tables in this wave. Issue **pointers / errata** via Stone Decision + Knowledge RFC if CAO requires.

### 6.3 Ops / product

| Impact | Action |
|---|---|
| Scan docs in production | Communicate: still blocked until OCR capability Decision; interim = pre-OCR PDF or human annotation |
| “We need all documents” | Product OKR maps to Recognition coverage %, not TextLayer % |
| Training | User mode stays assign-centric; Developer mode shows sources |

### 6.4 Estimated subsystem change (pre-implementation guard)

If any single EVO attempts to rewrite >30% of pipeline/selection/Evidence in one wave → **STOP** and split Stone / wave (per evolutionary rule). Prefer additive Recognition layer on EVO-002c–008 spine.

---

## 7. Required document updates (checklist)

### 7.1 Create / update in `ORC-Stone-01/docs` (authorized by this review’s Decision follow-up)

| Document | Action |
|---|---|
| `ARCHITECTURE_REVIEW_RECOGNITION_OBJECTS.md` | **This file** — Architecture Review SoT for the shift |
| `PRODUCT_ASSUMPTIONS.md` (new) | Catalog PA-* vs Canonical citations |
| `RECOGNITION_OBJECT_MODEL.md` (new, Design) | Formal fields · status · confirm rules |
| `RECOGNITION_SOURCES.md` (new, Design) | Source catalog · capability ids · enablement policy |
| `INPUT_PROVIDER_ARCHITECTURE.md` | Errata: embedded-text = default source, not product ceiling |
| `EVO002C_DECISION.md` | Pointer: superseded product assumption; architecture retained |
| `EVO009_*` … (per sequence below) | Analyze → Design → Decision per wave |
| `ARCHITECTURE_POINTER.md` | Optional link to this review |

### 7.2 Propose (do not silently edit) in `ORC-Knowledge`

| Document | Proposed change |
|---|---|
| `DPK001_LAYOUT_PATTERNS.md` §9 Image-only | Capability deferral language |
| `DPK001_GOVERNANCE.md` DIL row | Distinguish Canonical raw-immutability vs OCR-as-source governance |
| ProductRealization Stone-01 (if present) | Recognition Object boundary |

### 7.3 Explicit non-updates

- `ORC_CANONICAL_LAWS.md` — **no edit** from Stone alone  
- Knowledge Runtime code / pack binary schemas — **no edit** in Recognition design waves until Knowledge ADR  
- Evidence principle documents — **clarify only**; no principle inversion  

---

## 8. Recommended EVO sequence

All waves: **docs Decision first · code only after Decision AUTHORIZED**. No OCR engine libraries until EVO-012 Decision (or later) explicitly enables them.

| Wave | Title | Outcome | Code? |
|---|---|---|---|
| **EVO-009** | Laws vs Assumptions + Product Assumptions catalog | Separation rule locked; PA rewrite accepted | Docs only |
| **EVO-010** | Recognition Object Model + Confirm Gate | Formal model; map TextPrimitive ↔ RO; confirm→Knowledge rule | Design + thin types/adapters **optional** after Decision |
| **EVO-011** | Recognition Source Registry (capability-oriented) | Alias embedded-text; slots for layout/rules/human; **OCR/Vision registered disabled** | Additive registry — no OCR impl |
| **EVO-012** | OCR Recognition Source (authorized) | First OCR provider behind `cap.recognition.ocr`; provenance; UX confirm | **Only if Decision AUTHORIZED** |
| **EVO-013** | Vision / Layout fusion hardening | Optional vision; merge policy with EVO-006 resolution | After 012 stable |
| **EVO-014** | Human Annotation as Source + Progressive Learning bind | Elevate annotation to RO source; still confirm→Knowledge | Additive |
| **EVO-015** | Ops coverage gate | “Document usable” = coverage policy; scan UX; metrics | Product/UX |

**Parallel (non-blocking):** keep User/Developer audience UX; keep content-only reading default.

**Stop conditions:**

- Any wave proposing Foundation / Canonical Law text mutation → STOP  
- Any wave auto-ingesting OCR into Knowledge → STOP  
- Any wave rewriting raw PDF → STOP  
- >30% rewrite of stable pipeline in one wave → split Stone / re-sequence  

---

## 9. Decision request (for CAO / Product)

### Proposed Decision (not yet locked)

**READY WITH CONDITIONS — Architecture accepted; implementation gated.**

Conditions:

1. EVO-009 docs land and are cited as Product Assumption SoT.  
2. Embedded-text provider remains default enabled (compatibility).  
3. OCR/Vision remain **disabled** until EVO-012+ Decision names capability, provenance, and confirm UX.  
4. Knowledge Runtime / Evidence principles / Foundation untouched in EVO-009–011.  
5. Operational interim: pre-process scans **or** wait for EVO-012.

### Continue

| Path | Authorization |
|---|---|
| Docs EVO-009 / 010 / 011 | Requested next |
| OCR provider implementation | **Not** requested until EVO-012 Decision |
| Code in this review | **Forbidden** (complete) |

---

## 10. Summary diagram (target vs today)

**Today (assumption):**

```
PDF → Embedded Text → DOI/Region → UI → Human assign → Knowledge/Evidence
         ✗ scan dies here
```

**Target:**

```
Document → Recognition Sources* → Recognition Objects → Human confirm → Knowledge/Evidence
              (*embedded default; OCR/vision/rules/layout/human optional)
Presentation / Developer tools may show proposed objects without Knowledge ingest.
```

---

## 11. References

- `INPUT_PROVIDER_ARCHITECTURE.md` · `EVO002C_DECISION.md`  
- `EVO003_008_MIGRATION.md` · EVO-007 separation  
- `DIL001_DECISION.md` (lab condition: no OCR from that lab)  
- `DPK001_LAYOUT_PATTERNS.md` §9 · `DPK001_GOVERNANCE.md`  
- Operational validation: scan PDFs unusable under embedded-text-only assumption  

---

*End of Architecture Review. No code was modified under this request.*
