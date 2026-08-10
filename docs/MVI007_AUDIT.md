# MVI007 AUDIT — WAVE-01

**Auditor:** Implementation agent (WAVE-01)  
**Repo:** `D:\ORC\ORC-Stone-01`  
**Date:** 2026-07-17  

## Checklist

| # | Requirement | Result | Evidence |
|---|---|---|---|
| 1 | PDF preview + page + zoom + scroll | PASS | `apps/web/src/features/workspace/pdf-viewer.tsx` |
| 2 | Vietnamese knowledge sidebar / tree | PASS | `knowledge-sidebar.tsx` + `KNOWLEDGE_NODES` |
| 3 | Manual assign (context menu / shortcut) | PASS | `assign-menu.tsx`, Ctrl+G / Ctrl+S / undo-redo |
| 4 | Node + text highlight, multi-color | PASS | Node color map + text-layer tint |
| 5 | Undo / Redo | PASS | Client history stacks in `workspace-page.tsx` |
| 6 | Map 1↔1 text→node; node→many | PASS | Assignment model `ClassificationAssignment[]` |
| 7 | Tree updates immediately | PASS | React state after assign |
| 8 | Evidence on correction | PASS | `EvidenceService.recordStructureCorrected` |
| 9 | Evidence fields complete | PASS | documentId, node, before, after, timestamp, reviewer, version |
| 10 | Save session / resume | PASS | File session store under `storage/sessions` |
| 11 | No AI/OCR/LLM/login/workflow | PASS | Not introduced |
| 12 | No Foundation/Ontology/PE/PR/ADR/RFC | PASS | Code-only in Stone-01 |
| 13 | Audit docs only MVI007_* | PASS | This set of four files |

## Conditions

1. **DOCX:** Import still allowed; WAVE-01 viewer is PDF-only.  
2. **Automatic structure:** Seeded from existing deterministic extraction when available; empty PDF yields empty tree until manual assign.  
3. **Metadata store:** Verified with `METADATA_STORE=memory` (no DB redesign).  
4. **Evidence timing:** Generated on **Lưu** (diff vs last saved baseline), not on every keystroke — satisfies “every manual correction” at persist boundary.  

## Runtime verification

- Web: `http://localhost:3000` (dev) — `/`, `/documents` compile OK  
- API: Nest started on `:3001`  
- Curl smoke: upload → file 200 → classify save → evidence list OK  

## Findings

- None blocking for WAVE-01 usable product.  
- Follow-ups (next waves only): richer PDF text selection mapping, DOCX preview, stronger auto-seed quality (still non-AI).  
