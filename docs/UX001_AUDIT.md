# UX001 AUDIT

**Date:** 2026-07-17  
**Repo:** `D:\ORC\ORC-Stone-01`

## Checklist

| # | Requirement | Result | Notes |
|---|---|---|---|
| 1 | Auto highlight after parsing | PASS | Seed `source:'auto'` + PDF text-layer tint |
| 2 | Pen drag, no popup | PASS | `PenToolbar` + `onPenStroke` |
| 3 | Fixed colors | PASS | Locked in `@orc/shared` KNOWLEDGE_NODES |
| 4 | Tree sync both ways | PASS | Node→page/flash; highlight→expand/focus |
| 5 | Shortcuts Ctrl+1–9, Esc | PASS | Workspace key handler |
| 6 | Progressive helper + `?` | PASS | localStorage assign count |
| 7 | Floating hint | PASS | Compact pens near selection |
| 8 | Similar suggestion only | PASS | YES applies batch; NO dismisses |
| 9 | Evidence override fields | PASS | original/new/reason additive |
| 10 | Vietnamese only | PASS | Labels VN |
| 11 | No AI/arch/workflow | PASS | Deterministic fragment match |

## Conditions

1. Similar-fragment search uses current page text-layer corpus (best-effort).  
2. Highlight start/end still text-span based (not PDF glyph indices).  
3. Color lock is code-enforced; UI does not offer recolor.

## Findings

None blocking for UX lock.
