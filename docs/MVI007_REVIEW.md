# MVI007 REVIEW — WAVE-01 Manual Classification Workspace

**Product:** Stone-01 HO Notice Assistant  
**Wave:** ORC EXECUTION WAVE-01  
**Repo:** `ORC-Stone-01`  
**Date:** 2026-07-17  

## Scope delivered

| Capability | Status | Notes |
|---|---|---|
| Import PDF | Done | Existing `/documents` + open workspace |
| Document Viewer | Done | PDF preview, page nav, zoom, scroll (`react-pdf`) |
| Knowledge Sidebar (VI) | Done | 17 default nodes, tree + assignment counts |
| Manual classification | Done | Select text → right-click menu / Ctrl+G |
| Highlights | Done | Multi-color by node; node flash on assign |
| Undo / Redo | Done | Toolbar + Ctrl+Z / Ctrl+Y |
| Knowledge map | Done | 1 text → 1 node; 1 node → many texts; live tree |
| Evidence | Done | `StructureCorrected` on save |
| Save / resume session | Done | `storage/sessions/{documentId}.json` + localStorage mirror |

## Out of scope (confirmed not built)

- AI / OCR / LLM  
- Login / permission / notification  
- Workflow engine  
- Transformation / Draft Notice / Generate UI  
- Learning / Knowledge Update / Version Compare  
- Architecture redesign / Foundation / Ontology / PE / PR / ADR / RFC  

## UX

- Vietnamese-only labels  
- Office-style light chrome (`#f3f2f1` / Segoe UI / `#0078d4`)  
- Entry: `/documents` → **Mở** → `/workspace/[documentId]`  

## API surface (WAVE-01)

- `GET /documents/:id/file` — PDF bytes  
- `GET /classification/:documentId` — load/create session (seed from extraction when possible)  
- `PUT /classification/:documentId` — save assignments + corrections → evidence  
- `GET /classification/:documentId/evidence` — list `StructureCorrected`  

## Smoke (API)

- Upload PDF → file HTTP 200  
- Save assignment to `trich-yeu` → session v1 + evidence recorded  
- Resume GET returns saved assignment  
