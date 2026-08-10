# Architecture Alignment Report — Business Reading Engine

> **Date:** 2026-07-21  
> **Status:** ALIGNMENT REVIEW — **no code**  
> **Mandate:** Stop centering page-reading technology. Align Stone-01 to *business work completion*.  
> **Hard boundaries:** Foundation · Knowledge Runtime · Evidence principles unchanged. Evolutionary recommendations only.

---

## 0. Verdict

Stone-01 today is a **capable recognition + annotation workbench** that still answers the wrong primary question:

| Wrong north star (current gravity) | Required north star |
|---|---|
| “Can ORC read this page?” | “Can ORC help an experienced employee finish today’s work?” |

**Alignment gap:** Recognition modules optimize *structure visibility* and *text selection*. Business modules (Knowledge pens/nodes) already encode HO work, but the Runtime does not yet **orchestrate recognition toward those business questions**.

**Evolutionary stance:** Do **not** rebuild. **Re-rank** and **re-wire** existing modules so Recognition exists only to feed **Business Understanding Objects** that answer the seven work questions below. Technology sources (whatever produces recognition) stay behind the Recognition Layer — they are not the product story.

---

## 1. Target product identity

### 1.1 Business Reading Engine

A Business Reading Engine helps an experienced HO staff member:

1. **Orient** — know what they are looking at in seconds  
2. **Triage** — know if action is required  
3. **Route** — know who owns it and who is involved  
4. **Schedule** — know when it is due  
5. **Ground** — know which legal basis and attachments matter  
6. **Record** — attach verified facts into Knowledge with evidence  
7. **Close** — leave a reviewable day’s work package  

Page rendering and low-level recognition are **means**, not outcomes.

### 1.2 Seven business questions (acceptance lens)

Every recognized object that reaches the user (or Knowledge) **must** primarily serve at least one:

| # | Business question | Typical HO Knowledge anchors (already in Stone) |
|---|---|---|
| Q1 | What is this document? | `loai-van-ban`, `so-van-ban`, `trich-yeu`, `thong-tin-van-ban` |
| Q2 | Does it require action? | `yeu-cau`, `hieu-luc`, content of `noi-dung` |
| Q3 | Who is responsible? | `doi-tuong`, `nguoi-ky`, issuing unit |
| Q4 | When is the deadline? | `thoi-han`, `ngay-ban-hanh`, `hieu-luc` |
| Q5 | Which departments are involved? | `noi-nhan`, `doi-tuong`, `don-vi-ban-hanh` |
| Q6 | Which legal basis matters? | `can-cu`, `van-ban-lien-quan` |
| Q7 | Which attachments matter? | `bieu-mau`, related docs / annex cues |

**Rule:** If a module cannot be shown to improve Q1–Q7 (directly or by clearly reducing time-to-answer), it is **Recognition plumbing** or **later Stone** — not first-class product UI.

---

## 2. Layer policy (evolutionary)

| Layer | May contain | Must not become |
|---|---|---|
| **Business Understanding** | Answers to Q1–Q7, triage cards, responsibility/deadline summaries, Knowledge confirm | A dump of detectors |
| **Recognition** | Proposals that *could* answer Q1–Q7 (with provenance + confidence) | The user-facing “success” metric |
| **Presentation** | Show/hide, navigate, focus for humans | Business truth |
| **Knowledge** | Confirmed facts only (human gate) | Auto-filled from unconfirmed recognition |
| **Evidence** | Attributable snapshots of what was confirmed | Engine logs as product |
| **Governance / Infra** | Capability, locks, DI, plugins | Visible “features” for end users |

Reuse rule: Prefer **later Stones** for deep domain workflow, routing engines, deadline calendars, org graphs — Stone-01 keeps the **reading → understand → confirm → evidence** spine.

---

## 3. Module review matrix

Scoring:

- **BU** — Improves business understanding (Q1–Q7)?  
- **RT** — Reduces experienced-user reading time?  
- **Reuse** — Another Stone can reuse as-is / with thin adapter?  
- **Home** — Stay Recognition · Promote Business · Keep Presentation · Keep Knowledge/Evidence · Demote Infra · **Move later Stone**

Legend for Home: `Rec` · `Biz` · `Pres` · `Know` · `Evid` · `Gov` · `Infra` · `Later`

### 3.1 Business / Knowledge spine (closest to north star)

| Module | BU | RT | Reuse | Home | Notes |
|---|---|---|---|---|---|
| Knowledge nodes / pens (`KNOWLEDGE_NODES`) | **Y** | **Y** | **Y** | `Know` | Already maps Q1–Q7; **promote as product schema of work**, not “labels for highlights” |
| Assign flow + FloatingHint + Similar | **Y** | **Y** | **Y** | `Know` | Core “finish today’s work” loop; evolve UX copy toward Q* not “tô chữ” |
| Knowledge workspace tree / progress | **Y** | **Y** | Partial | `Know` | Reframe progress as **triage completeness** (missing deadline? missing owner?) |
| Classification / session API | **Y** | Indirect | **Y** | `Know` | Keep; ensure payloads stay business-field oriented |
| Knowledge extraction (API) | Partial | Partial | **Y** | `Know` / `Later` | Useful seed; must never skip human confirm; deepen only if it answers Q* |
| Transformation (API) | Partial | N | **Y** | `Later` | Branch models = downstream Stone/workflow, not BRE core UI |
| DPK bridge / legal-structure outline | Partial | **Y** | **Y** | `Rec`→`Biz` | Keep as recognition aid; surface only when it answers Q1/Q6 |

### 3.2 Recognition producers (exist to feed Q1–Q7)

| Module | BU | RT | Reuse | Home | Notes |
|---|---|---|---|---|---|
| DOI (object intelligence) | Conditional | Conditional | **Y** | `Rec` | Valuable **only** when classes map to Q* (signer→Q3, deadline-like→Q4, seal→Q1/Q3). Demote raw class lists in User mode (already). |
| Structure plugins (header/footer/table/…) | Conditional | Conditional | **Y** | `Rec` | Chrome detection helps RT if it **hides noise**; business value is secondary. Keep Rec; don’t lead product narrative. |
| Region Engine | Conditional | **Y** | **Y** | `Rec` | Reading bands reduce search time; not a business answer by itself. |
| DPL / Input Provider / Resolution | N (plumbing) | Indirect | **Y** | `Infra` | Keep; invisible to business user. |
| Locator / Separation / Plugin SDK | N | N | **Y** | `Infra`/`Gov` | Keep for reuse; not product features. |
| Derived / OCR-capable slots | N until mapped to Q* | — | **Y** | `Infra` | **Out of scope for this alignment narrative**; enable only when a source improves Q* coverage. |
| Governance capability registry | N | N | **Y** | `Gov` | Keep. |
| DIL (text confidence / correction) | Conditional | Conditional | **Y** | `Rec` | Business-relevant only when corrections protect Q* fields (e.g. số VB, hạn). |
| Recognition UX (map, corrections, experience bar) | Conditional | Conditional | Partial | `Pres`/`Rec` | Developer/triage tool; never the User north star. |
| Page diagnostics / Diag | N | N | **Y** | `Pres` (dev) | Stay developer-only. |

### 3.3 Presentation & workbench

| Module | BU | RT | Reuse | Home | Notes |
|---|---|---|---|---|---|
| PDF/document viewer + toolbar | Indirect | **Y** | **Y** | `Pres` | Necessary canvas; not the product identity. |
| Structure presentation (content-only / modes) | Indirect | **Y** | **Y** | `Pres` | **Keep**: reduces noise → RT↑. Frame as “focus on work content”. |
| Audience User vs Developer | **Y** | **Y** | Partial | `Pres` | Aligns with BRE: User sees work; Dev sees recognition. **Evolve User home screen toward Q* cards.** |
| Document outline (pages / layers) | Indirect | **Y** | Partial | `Pres` | User: pages + business outline only. Layers = Dev. |
| Capability / Object / Structure panels | Weak | Weak | Partial | `Rec` UI | Remain Developer; optional “Business hints” derived view later. |
| Find-in-document | Indirect | **Y** | **Y** | `Pres` | Keep as time-saver for Q6/Q7 lookup. |
| Workbench modes (authoring/review/…) | Weak | Mixed | Partial | `Pres` | Simplify User to work modes: **Triage / Fill / Review day** (evolutionary rename), keep eng modes under Developer. |

### 3.4 Evidence, review, import

| Module | BU | RT | Reuse | Home | Notes |
|---|---|---|---|---|---|
| Evidence store + footer | **Y** (trust) | Indirect | **Y** | `Evid` | Supports “finish work with audit”; keep principles. |
| Review export package | **Y** | Indirect | **Y** | `Evid`/`Later` | Closing the day’s work; strengthen as **work package**, not eng dump. |
| Document import | Indirect | **Y** | **Y** | `Infra` | Keep. |
| Progressive guide / shortcuts | Indirect | **Y** | Partial | `Pres` | Reframe tips around Q* (“chưa có hạn xử lý”). |

---

## 4. Synthesis — what Stone-01 should optimize

### 4.1 First-class (promote / reframe now — evolutionary)

1. **Business question coverage** over Knowledge nodes (Q1–Q7 checklist).  
2. **Assign / confirm loop** as the primary verb (“ghi nhận việc”, not “tô”).  
3. **Content-only reading** as default (already) — noise off = faster triage.  
4. **User audience** as default — hide recognition chrome.  
5. **Review package** as end-of-work artifact.

### 4.2 Recognition Layer (keep, subordinate)

- DOI, Region, Structure plugins, DPL/Input, DIL  
- Purpose: **propose candidates** that fill Q1–Q7 faster  
- Success metric shift: *% of Q* answered with ≤N minutes* — not *% text coverage*

### 4.3 Move or defer to later Stones

| Concern | Why later Stone |
|---|---|
| Org routing / SLA engines | Beyond reading; needs org graph & workflow |
| Deep transformation / branch models | Post-understanding automation |
| Full attachment vault / ECM | Storage & policy Stone |
| Calendar / deadline orchestration | Work management Stone |
| Heavy vision/OCR productization | Only if it measurably lifts Q* coverage under Decision |  
| Multi-doc case files | Case Stone consuming Stone-01 outputs |

### 4.4 Demote in product narrative (keep in code)

- Diag percentages, detector id lists, “năng lực vùng” as user language  
- Recognition Map as primary UI  
- “Can we read the page?” status as the headline  

---

## 5. Recommended evolutionary changes (no implementation in this report)

Ordered for minimal disruption; each ≤ incremental rewire.

| Step | Change | Effect on Q* / RT | Risk |
|---|---|---|---|
| **E1** | Publish Business Reading Engine north star in Stone docs; retire page-reading as success criterion | Alignment | None (docs) |
| **E2** | User home: **Work Brief** panel answering Q1–Q7 from *confirmed Knowledge only* (+ “unknown” gaps) | BU↑ RT↑ | Low — additive panel |
| **E3** | Map DOI/structure proposals → **optional suggestions** into Q* slots (still human confirm) | RT↑ | Low — reuse assign |
| **E4** | Reframe Knowledge progress as **triage completeness** (missing owner/deadline/action) | BU↑ | Low |
| **E5** | Developer mode keeps full Recognition; User never sees Rec success metrics | RT↑ | Already partial |
| **E6** | Review export labeled as **Day Work Package** (same schema) | Close-the-loop | Low |
| **E7** | Gate any new Recognition feature: must name which Q* it improves or be rejected | Prevents drift | Process |
| **E8** | Later Stones: Routing, Case, Deadline — consume confirmed Knowledge, not raw recognition | Reuse | Separate Stones |

**Explicit non-goals for alignment waves:** rewriting Foundation; changing Evidence principles; centering new extraction technologies in the product story.

---

## 6. Compatibility & reuse

| Asset | Reuse stance |
|---|---|
| Input / Recognition infra (EVO-002c–008) | **Keep** as substrate; other Stones may host alternate sources |
| Knowledge node set | **Keep** as BRE vocabulary; extend only with Q*-justified nodes |
| Evidence / Review | **Keep**; presentation rename only |
| Region / DOI / plugins | **Keep** in Recognition Layer; consume via suggestion→confirm |
| Transformation API | **Reuse later**; not BRE UI core |

Backward compatibility: existing assignments, sessions, evidence remain valid. Alignment is **priority and UX composition**, not schema break.

---

## 7. Alignment scorecard (honest)

| Dimension | Today | Target after E1–E6 |
|---|---|---|
| Product question | Page readable? | Work finishable today? |
| User sees first | Document + optional noise | Work Brief (Q1–Q7) + content |
| Recognition role | Often the feature | Hidden servant of Q* |
| Knowledge role | Highlight targets | Confirmed business answers |
| Success metric | Coverage / diags | Time-to-triage + Q* completeness |
| Stone boundary | Blurs into eng lab | Clear BRE; later Stones for workflow |

**Current score vs BRE ideal: ~4/10** (strong annotation spine; weak business orchestration).  
**With E1–E6 only (evolutionary): ~7/10** without new engines.

---

## 8. Decision request

### Proposed

**Architecture Alignment ACCEPTED as Product North Star for Stone-01 evolutionary waves.**

### Conditions

1. No code in this review.  
2. Next authorized work is **docs + UX composition (E1–E2)**, not new recognition engines.  
3. Any Recognition change must declare Q1–Q7 impact.  
4. Foundation / Knowledge Runtime / Evidence principles untouched.  
5. Later Stones explicitly own routing, case, and calendar-class problems.

### Continue

| Next | Auth |
|---|---|
| E1 docs (BRE charter + Q* gate) | Recommended |
| E2 Work Brief (User panel) Design | Recommended after E1 |
| New recognition engines | Not implied by this report |

---

## 9. One-line doctrine

> **Recognition proposes. Business questions organize. Humans confirm. Evidence remembers. Other Stones act.**

---

*End of Architecture Alignment Report. No code written.*
