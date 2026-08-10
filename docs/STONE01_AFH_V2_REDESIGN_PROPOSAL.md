# Stone-01 AFH v2.1 — Product Architecture

> **Project:** ORC · **Stone:** Stone-01 AFH · **Version:** 2.1  
> **Status:** Product Architecture Expansion  
> **Date:** 2026-07-21 · **Code:** none — product architecture only  
> **Core Principle (binding):** **Knowledge First → Work First**  
> **Higher authority:** … · **Experience redesign (binding for default UX):** [STONE01_WORK_ASSISTANT_REDESIGN.md](../../ORC-Knowledge/Architecture/ProductRealization/Stone-01/STONE01_WORK_ASSISTANT_REDESIGN.md) · [PDR-005](../../ORC-Knowledge/Architecture/ProductHistory/ProductDecisions/PDR-005-work-assistant-redesign.md)  
> **Locks:** Foundation · Knowledge Runtime · Evidence Principles · Provenance · Human Governance · Provider Architecture · Recognition Engine — **preserved**; evolution of product Decisions follows Constitution P6 / P11 / P12 / P15  

---

## Architecture Decision — Knowledge First → Work First

> Complies with Constitution **P1** (User Value First), **P2** (Knowledge First), **P10** (Knowledge Must Produce Action).

### Decision

Replace standalone **Knowledge First** with:

> **Knowledge First → Work First**

### Meaning

| Statement | Binding |
|---|---|
| Knowledge is the **central domain object** | Yes |
| Work is the **ultimate business outcome** | Yes |
| Documents exist only to produce Knowledge | Yes |
| Knowledge exists only to support Work | Yes |
| Stone-01 is **not** the final destination | Yes |
| Knowledge is **fuel** of ORC — not the final product | Yes |
| Real product of ORC = **help people finish work** | Yes |

### Dual design test (mandatory)

Every screen, workflow, component, and Stone must answer **both**:

1. **“How does this improve the organization’s knowledge?”**  
2. **“How does this help someone finish work?”**

Fail if it only answers document processing **or** knowledge-for-its-own-sake with no path to action.

### Domain hierarchy (binding)

| Layer | Role |
|---|---|
| **Work / Suggested Actions** | **Ultimate outcome** — what people do next |
| **Organizational Intelligence** | **Deterministic reasoning** — Knowledge → possible work |
| **Knowledge Package** | **Central domain object** — Organizational Memory |
| **Business Understanding** | Meaning layer (Recognition → Knowledge) |
| **Recognition** | Infrastructure |
| **Documents** | Evidence only |

### Pipeline (binding — replaces v2.0.1 end-at-Library)

```text
Evidence
   ↓
Recognition                          ← infrastructure
   ↓
Business Understanding               ← meaning
   ↓
Knowledge Package                    ← central domain / Organizational Memory
   ↓
Organizational Intelligence          ← deterministic · NOT “AI product”
   ↓
Suggested Actions                    ← recommendations only
   ↓
Human Decision                       ← approve / defer / dismiss
   ↓
Future Stones                        ← execute work (never re-parse Evidence)
```

**Stone-01 finishes only after Suggested Actions are generated** (and presented for Human Decision).  
Publishing Knowledge without Actions is an incomplete harvest.

---

## 0. One-line mission (Work First)

> **Turn evidence into confirmed Knowledge, then into Suggested Actions, so people finish work faster — and every future Stone inherits both Organizational Memory and Organizational Experience.**

| Stop thinking | Start thinking |
|---|---|
| Stone-01 = final product | Stone-01 = harvest + action proposal |
| Knowledge = destination | Knowledge = **fuel** for Work |
| Improve document processing | Improve **finished work** |
| Library of files/records | Knowledge Packages + Suggested Actions |
| Extract fields | Agree with ORC’s understanding → act |

**Stone-02+ consume Knowledge Packages + Suggested Actions. Never parse original documents again.**

---

## 1. Product Vision

### 1.1 Why Stone-01 exists

Organizations do not need another place to store files. They need **less re-reading** and **faster finished work**. Stone-01 harvests Knowledge so ORC can **propose the next work** — reminders, branch circulars, notifications, compliance tracking — under human decision.

**Work First test:** A perfect Knowledge Package with zero Suggested Actions fails Stone-01 completion criteria.

### 1.2 North-star (immediate after import)

User sees — **not** PDF → highlight → primitives:

```text
Summary
   ↓
Knowledge Tree
   ↓
Suggested Actions
   ↓
Items Requiring Review
```

Business answers (what / who / when / basis) **and** proposed work (what to do next).

### 1.3 Success metrics (do not measure OCR accuracy)

| Metric | Intent |
|---|---|
| **Knowledge Completeness** | Required Knowledge families confirmed |
| **Knowledge Confidence** | Trust after evidence × human confirm |
| **Action Readiness** | % Suggested Actions with enough validated Knowledge to run on future Stones |
| Review Time | Open → understanding agreed + actions reviewed |
| Time Saved | Re-read + manual drafting avoided |
| Reuse Rate | Packages/Actions consumed by later Stones |
| Reduction of Manual Reading | Sessions without full Evidence scroll |
| Reduction of Manual Drafting | Actions accepted that seed Stone-02+ drafts |
| Inbox clearance | Unknowns resolved by Knowledge Managers |
| Reconciliation health | Post-ingest conflicts resolved |

### 1.4 Absolute product rules

1. **Knowledge First → Work First** — Knowledge without a path to Work is incomplete.  
2. Business Understanding is mandatory between Recognition and Knowledge.  
3. Organizational Intelligence is **deterministic business reasoning** — not marketed as AI.  
4. Suggested Actions are **recommendations only** — no automatic execution in Stone-01.  
5. Nothing becomes Knowledge without human confirmation (governed exceptions later).  
6. Unknowns → Knowledge Inbox (Managers).  
7. Evidence immutable.  
8. Library holds Knowledge Packages (Organizational Memory); Actions = Organizational Experience.  
9. After Package publish: Knowledge Reconciliation; Actions remain linked and re-scored (Action Readiness).  
10. Future Stones consume **Packages + Actions** only.

---

## 2. UX Vision

### 2.1 Mental model

> Review answers: **“Do you agree with ORC’s understanding?”**  
> Not: **“Please extract fields manually.”**

After agreement, user reviews **Suggested Actions**: *Should we do this work next?*

### 2.2 Default experience after import

| Zone | Content |
|---|---|
| **Summary** | Business Brief + Completeness · Confidence · Action Readiness |
| **Knowledge Tree** | Editable Organizational Memory for this Package |
| **Suggested Actions** | Ranked recommendations with reason + future Stone |
| **Items Requiring Review** | Low confidence · gaps · Inbox · blocked actions |
| **Evidence** | On demand only |

### 2.3 Layout concept

```text
┌─ Summary · Completeness · Confidence · Action Readiness ─────────┐
├─ Knowledge Tree (Memory) ──┬─ Suggested Actions (Experience) ────┤
│                            │  · Create Reminder (Deadline)        │
│                            │  · Issue Branch Circular (Req.)      │
│                            │  · Notify Depts (New regulation)     │
├─ Items requiring review ───┴─ Evidence (drawer) ─────────────────┤
└─ [Agree & continue] [Publish Package + Actions] [Inbox] ─────────┘
```

---

## 3. Knowledge Workspace

Surfaces must improve **knowledge and readiness for work**:

| Surface | Work First purpose |
|---|---|
| Summary | State of understanding + Action Readiness |
| Knowledge Tree | Confirm Memory that fuels Actions |
| Suggested Actions board | Decide next work (approve/defer/dismiss) |
| Review queue | Resolve blockers to understanding or readiness |
| Knowledge Inbox | Evolve types so future Actions become possible |
| Package publish | Hand off Memory + Experience to Library / Stones |

---

## 4. Knowledge Tree

Unchanged families as Organizational Memory shape of the Package.  
**Work First:** Tree edits that unlock Suggested Actions (e.g. add Signer → Signature Workflow readiness) are first-class.

Inbox items stay out of the confirmed tree until Managers resolve them.

---

## 5. Knowledge Object Model

### 5.1 Knowledge Package (Organizational Memory)

Extends v2.0.1 Package with:

```text
KnowledgePackage
  … (objects, completeness, confidence, reconciliation, inbox…)
  organizationalIntelligenceRunId
  suggestedActions[]           → SuggestedAction
  actionReadiness              → score + blockers
  harvestComplete              → true only if Actions generated & presented
```

### 5.2 Suggested Action (Organizational Experience — see Ch.18)

Bound to Package; references Knowledge Objects; never executes itself in Stone-01.

### 5.3 Evidence

Still secondary — proves Knowledge that justifies Actions.

---

## 6. Recognition + Business Understanding

Pipeline mid-section unchanged in duty:

Evidence → Recognition (infra) → Business Understanding → Knowledge Objects → Package  

**Extension:** Package is **input** to Organizational Intelligence (Ch.17), not the end of Stone-01.

**Forbidden:** Recognition → Action (must pass Understanding + Knowledge).  
**Forbidden:** Treating OCR success as Action Readiness.

---

## 7. Knowledge Inbox

Unchanged governance (Managers).  

**Work First:** Inbox resolution often unblocks Action types (new Knowledge type → new Action templates).

---

## 8. Knowledge Evolution

Schema evolution enables **new Action Taxonomy entries** over time.  
Experience (accepted/dismissed Actions) feeds ranking — not silent automation.

---

## 9. Learning Strategy

| Learns from | Improves |
|---|---|
| Understanding confirm/correct | Knowledge quality |
| Inbox Map/Create type | Future Understanding + Actions |
| Action approve/defer/dismiss | Organizational Intelligence ranking |
| Reconciliation | Memory consistency → Action validity |

Never learn execution from OCR/LLM directly.

---

## 10. Library Strategy

### 10.1 Organizational Memory + Experience

Library stores:

- **Knowledge Packages** (Memory)  
- **Suggested Actions** (Experience) — with decision history  

### 10.2 Knowledge Reconciliation

After ingest: reconcile Memory; **recompute Action Readiness** on affected Packages/Actions.

### 10.3 Hand-off

Published Package + open/approved Action set → Future Stones (Ch.20).

---

## 11. Migration

| Phase | Work First outcome |
|---|---|
| M0–M5 | As v2.0.1 (shell → Understanding → Inbox → Package → Reconciliation) |
| **M6** | Organizational Intelligence + Suggested Actions generation |
| **M7** | Action Readiness metric in Summary |
| **M8** | Future Stone contract: Package + Actions consumer stub |
| M9 | Recognition providers+ (infra only) |

Stone-01 “done” definition updates at M6: Actions must be generated before harvestComplete.

---

## 12. Reuse analysis

| Asset | Role under Work First |
|---|---|
| Foundation / Runtime / Evidence | Unchanged |
| Providers · DOI · Structure · Suggest | Feed Understanding → Knowledge fuel |
| Work Brief · Nhận/Bỏ | Agree with understanding |
| Table/Legal Basis harvest | Knowledge that enables Actions (e.g. Track Deadline) |
| Accuracy-before-batch | Applies to Package publish **and** Action suggestion quality gates |

New product layers (OI, Actions, Readiness) sit **above** existing engines — no Foundation rewrite.

---

## 13. Risk analysis

| Risk | Failure | Mitigation |
|---|---|---|
| Stop at Knowledge | Fuel without Work | harvestComplete requires Actions |
| Auto-execute Actions | Bypass human | Recommendations only in Stone-01 |
| Call OI “AI” | Wrong expectations / lock risk | Deterministic reasoning · documented rules |
| Actions without Knowledge | Hallucinated work | Action Readiness blockers |
| Viewer-first UX | Manual extract relapse | Summary→Tree→Actions→Review |
| Stone-02 re-parses PDF | Breaks contract | Package+Actions only input |
| Taxonomy freeze | Can’t express new work | Extensible Action Taxonomy |

---

## 14. Architecture impact

```text
[ UX: Summary · Tree · Suggested Actions · Review · Evidence drawer ]
        ↓
[ Organizational Intelligence → Suggested Actions ]   ★ Work outcome
        ↓
[ Knowledge Packages · Reconciliation · Inbox ]
        ↓
[ Business Understanding ]
        ↓
[ Recognition façades ]
        ↓
[ Existing engines / Providers ]
        ↓
[ Foundation — unchanged ]
```

| Primary | Supporting | Infrastructure |
|---|---|---|
| Knowledge Package · Suggested Action | Evidence | Recognition · Providers |
| Human Decision on Actions | — | — |

---

## 15. UI mockups (concept) — Work First

### 15.1 After import

```text
Summary: Công văn BCP · Completeness 78% · Confidence 70% · Action Readiness 62%
Blockers: Signer missing · Inbox 1

Knowledge Tree          Suggested Actions
✓ Metadata              ① Track Deadline — due 30/08 — Stone-Calendar?
✓ Legal Basis (3)       ② Issue Local Document — branch circular — Stone-02
✓ Tables (1)            ③ Notify Departments — related units — Stone-Notify
✗ Signer                ④ Prepare Signature Workflow — blocked (no signer)

Items requiring review: Signer · Inbox «Chương trình BCP»
[I agree with understanding] [Review actions] [Open evidence…]
```

### 15.2 Review stance

```text
Do you agree with ORC’s understanding of this document?
[Yes, confirm] [Fix highlighted items] — not a blank field form.
```

### 15.3 Action card

```text
Issue Local Document
Reason: Implementation requirement in Tasks#2
Knowledge: Tasks#2 · Participants · Deadline#1
Priority: High · Confidence: MEDIUM · Approval: required
Future Stone: Stone-02 · Est. time saved: ~45 min drafting
[Approve for Stone-02] [Defer] [Dismiss]
```

---

## 16. Implementation roadmap (architecture waves)

| Wave | Name | Outcome |
|---|---|---|
| W0–W5 | As v2.0.1 | Shell → Understanding → Inbox → Package → Reconciliation |
| **W6** | Organizational Intelligence | Deterministic Knowledge→Action proposals |
| **W7** | Suggested Actions UX | Board + Human Decision |
| **W8** | Action Readiness | Metric + blockers in Summary |
| **W9** | Future Stone contracts | Package + Actions API/consumer stub |
| W10 | Providers+ | Recognition infra only (Decision) |

---

## 17. Organizational Intelligence

### 17.1 Definition

**Organizational Intelligence (OI)** is a **conceptual, deterministic business reasoning layer**.

It is **NOT** an AI product feature, **NOT** LLM autonomy, **NOT** Recognition.

**Job:** Transform **confirmed / proposed Knowledge** into **possible work** (Suggested Actions).

### 17.2 Placement

```text
Knowledge Package
   ↓
Organizational Intelligence     ★ deterministic rules / playbooks / taxonomies
   ↓
Suggested Actions
```

### 17.3 Example mappings (illustrative)

| Knowledge | Possible Action |
|---|---|
| Deadline | Schedule Reminder / Track Deadline |
| Implementation Requirement (Task) | Issue Local Document (Branch Circular) |
| Signer | Prepare Signature Workflow |
| New Regulation / Legal Basis change | Notify Related Departments |
| Table of units × forms | Create Checklist / Assign Task |
| Conflict with prior Package | Flag Conflict / Suggest Review |
| High Completeness Package | Generate Summary / Update Knowledge Library |

### 17.4 Design rules

1. Every Action cites **Business Reason** + **Related Knowledge Objects**.  
2. Missing Knowledge → Action may still appear as **blocked** (drives Action Readiness).  
3. OI rules are versioned, reviewable, org-extensible (playbooks) — not opaque model weights as SoT.  
4. OI may use scores from Confidence/Completeness; it does not replace Human Decision.

### 17.5 Organizational Memory vs Experience

| Concept | Artifact |
|---|---|
| Organizational Memory | Knowledge Packages |
| Organizational Experience | Suggested Actions (+ decisions) |

Future Stones inherit **both**.

---

## 18. Suggested Actions

### 18.1 Principle

Every imported document’s harvest should generate **Suggested Actions**.  
**No automatic execution** in Stone-01 — **recommendation only**.

### 18.2 Suggested Action object

```text
SuggestedAction
  id, packageId
  actionTypeId              → Action Taxonomy
  title, description
  businessReason
  relatedKnowledgeObjectIds[]
  priority                  → critical | high | medium | low
  confidence                → HIGH | MEDIUM | LOW (+ score)
  requiresHumanApproval     → always true in Stone-01 default
  futureStoneId             → Stone-02 | Calendar | Notify | … | TBD
  estimatedTimeSaved        → duration hint
  readiness                 → ready | blocked
  blockers[]                → missing Knowledge / Inbox / conflicts
  decision                  → pending | approved | deferred | dismissed
  decidedBy, decidedAt
```

### 18.3 Action Taxonomy (extensible)

Reusable, versioned catalog. Initial set:

| Action Type | Typical Knowledge fuel | Example Future Stone |
|---|---|---|
| Issue Local Document | Tasks · Participants · Subject | Stone-02 |
| Assign Task | Tasks · Participants · Deadline | Task Stone |
| Create Checklist | Tables · Tasks | Checklist Stone |
| Schedule Reminder | Deadlines | Calendar |
| Notify Departments | Participants · Legal Basis · Subject | Notify |
| Track Deadline | Deadlines · Tasks | Calendar / Compliance |
| Monitor Compliance | Legal Basis · Tasks · Tables | Compliance |
| Generate Summary | Package Brief | Summary / Briefing |
| Compare Previous Version | Reconciliation match | Diff / Review |
| Update Knowledge Library | Package publish | Library ops |
| Flag Conflict | Reconciliation conflict | Review |
| Suggest Review | Low Confidence · Inbox | Human Review |
| Prepare Signature Workflow | Signers · Metadata | Signature |
| *(Future Action Types)* | … | … |

Taxonomy **must remain extensible** via org governance (parallel to Knowledge type evolution).

### 18.4 Human Decision

User/Manager:

- **Approve** — Action eligible for Future Stone intake  
- **Defer** — keep Experience, postpone  
- **Dismiss** — not applicable (learning signal)

Stone-01 never runs the work itself.

---

## 19. Action Readiness

### 19.1 Definition

> **Action Readiness** = percentage of Suggested Actions that have **enough validated Knowledge** to be executed by Future Stones.

### 19.2 Example

```text
Knowledge Completeness   95%
Action Readiness         82%
Reason: Signer still missing → “Prepare Signature Workflow” blocked;
        one Notify Action blocked on unresolved Inbox type.
```

### 19.3 Scoring (conceptual)

For each Suggested Action:

- required Knowledge types present & confirmed → contributes to ready  
- missing / low-confidence / Inbox-dependent → blocked  

Package Action Readiness = ready / (ready + blocked) among generated Actions (policy may exclude dismissed).

### 19.4 Product use

- Summary chrome KPI beside Completeness / Confidence  
- Guides Review: “Fix these Knowledge gaps to unlock work”  
- Gate for Future Stone: may refuse Action until readiness = ready  

---

## 20. Future Stone Contracts

### 20.1 Hard contract

```text
Future Stone input =
    Knowledge Package
  + Suggested Actions (approved / eligible)
```

**Forbidden:** Parsing original PDF / Word / scan / image / email again as the work path.

Evidence may be **displayed** for human trust via pointers inside the Package — never re-harvested as the Stone’s understanding engine.

### 20.2 Stone-01 completion contract

Stone-01 harvest is complete when:

1. Business Understanding applied  
2. Knowledge Package assembled (Memory)  
3. Organizational Intelligence run  
4. Suggested Actions generated & shown (Experience)  
5. Human can decide on understanding + actions  
6. (On publish) Reconciliation run; Action Readiness recomputed  

### 20.3 Stone-02 (illustrative)

Consumes approved **Issue Local Document** Actions + related Knowledge (Subject, Tasks, Participants, Legal Basis, Tables) to draft branch circular — **no PDF parse**.

### 20.4 Inheritance

| Inherit | From |
|---|---|
| Organizational Memory | Knowledge Packages |
| Organizational Experience | Suggested Actions + decisions |
| Playbooks | OI rules + Action Taxonomy versions |

---

## Appendix A — Product Owner checklist (v2.1)

1. Ratify **Knowledge First → Work First**.  
2. Ratify extended pipeline through **Suggested Actions + Human Decision**.  
3. Ratify **Organizational Intelligence** as deterministic (not AI product).  
4. Ratify **Action Taxonomy** v0 + extensibility process.  
5. Ratify **Action Readiness** as primary metric with Completeness/Confidence.  
6. Ratify Stone-01 **harvestComplete** requires Actions generated.  
7. Ratify Future Stones consume **Package + Actions** only.  
8. Decide: Can user publish Package with Readiness &lt; threshold? (warn vs block).  
9. Decide: Default `requiresHumanApproval` always true (recommended).  
10. Carry forward Inbox / Manager / Reconciliation decisions from v2.0.1.

---

## Appendix B — Chapter alignment (Work First)

| Ch. | Alignment |
|---|---|
| 0–1 | Knowledge as fuel; Work as outcome; metrics include Action Readiness |
| 2–3 | UX = Summary → Tree → Actions → Review |
| 4–5 | Package holds Actions; harvestComplete |
| 6 | Understanding fuels Knowledge fuels OI |
| 7–9 | Inbox/Evolution/Learning unlock Actions |
| 10 | Memory + Experience in Library |
| 11–16 | Migration/roadmap through Actions & contracts |
| **17** | Organizational Intelligence |
| **18** | Suggested Actions + Taxonomy |
| **19** | Action Readiness |
| **20** | Future Stone Contracts |
| **21** | Layout Layer Harvest (Giữ/Không dùng → Knowledge) |

---

## Appendix C — Relation to prior versions

| Doc | Relation |
|---|---|
| **ORC Product Constitution v1.0** | **Higher priority** than this AFH design; AFH must comply |
| AFH v2.0.1 Knowledge First | Superseded in principle by **Knowledge First → Work First**; Package/Inbox/Understanding retained |
| This v2.1 | Adds OI · Actions · Readiness · Future Stone contracts; extends pipeline past Library |
| Foundation / STONE01_* | Cited; not rewritten; product Decisions may evolve under Constitution P15 |
| Accuracy-before-batch | Remains; applies to Package + Action quality |

---

## Appendix D — Master diagram

```text
                    ┌─────────────────────────────────────┐
                    │     HELP PEOPLE FINISH WORK         │
                    └─────────────────────────────────────┘
                                      ▲
                                      │
              Human Decision ← Suggested Actions ← Organizational Intelligence
                                      ▲                         ▲
                                      │                         │
                              Knowledge Package ────────────────┘
                           (Organizational Memory)
                                      ▲
                         Business Understanding
                                      ▲
                         Layout Layer Harvest ★
                    (keep / discard planes → Knowledge)
                                      ▲
                              Recognition (infra)
                                      ▲
                            Evidence (documents)
```

---

## 21. Layout Layer Harvest

### 21.1 Problem

Peeling individual chrome objects (watermark glyph, stamp fragment, …) forever does not finish work. Users need **planes of the page** they can keep or discard, then harvest Knowledge from kept planes.

### 21.2 Principle (Constitution)

Complies with **P1** User Value, **P3** Business Understanding, **P9** Minimal Interaction, **P13** Knowledge Economy.

### 21.3 Unit of work

**Layout Layer** = coalesced presentation plane derived from existing Recognition regions/modules:

| Layer | Default disposition | Typical Knowledge |
|---|---|---|
| Header / logo | Review | Số VB · Trích yếu |
| Watermark | Discard (reading) | Optional provenance |
| Body | Keep | Subject · Content |
| Legal basis | Keep | Căn cứ (split per cite) |
| Table | Keep | Biểu mẫu (grid) |
| Signature / stamp | Discard (reading) | Người ký (optional) |
| Footer | Review | — |
| Annex | Keep | Phụ lục / tables |

**Discard ≠ delete Evidence.** Raw file remains. Discard removes layer from reading / Knowledge path.

### 21.4 Flow

```text
Evidence → Recognition regions
  → derive Layout Layers
  → Human: Giữ | Không dùng | Xem lại
  → Kept layers → Knowledge hints → Nhận
  → Discarded modules hidden in Evidence presentation
```

### 21.5 Implementation note (evolutionary)

MVP reuses StructureRegion / moduleId aggregation — **no Foundation rewrite**. Future: stronger layout segmentation still feeds the same Layer contract.

### 21.6 Success

User reviews **layers**, not detector panels. Time-to-first-Knowledge from a kept layer &lt; time spent fighting watermark selection.

---

*End of AFH v2.1 · Layout Layer Harvest (Ch.21) · Constitution-aligned.*
