# LAB001 REVIEW — ORC Review Package Foundation

**Lab:** ORC-LAB-001  
**Repo:** `ORC-Stone-01`  
**Date:** 2026-07-17  

## Purpose

One-click **Evidence Export** of a working session for product review, diagnosis, and UX improvement.  
Not bug reporting. Not telemetry. Not analytics.

## Delivered

| Feature | Status | Location |
|---|---|---|
| Button **Xuất gói Review** | Done | Workspace toolbar |
| Workspace snapshot (page, zoom, sidebar, node, dirty) | Done | `session.json` + `workspace.png` |
| Knowledge tree export | Done | `knowledge-tree.json` |
| Highlight export | Done | `highlight.json` |
| Evidence export | Done | `evidence.json` |
| Session events (import/assign/undo/redo/save + duration) | Done | `session.json` |
| Performance | Done | `performance.json` |
| Environment | Done | `environment.json` |
| README.txt | Done | inside ZIP |
| ZIP → `storage/review/` | Done | `POST /review/packages` |

## Package layout

```
review-package/
  workspace.png
  knowledge-tree.json
  highlight.json
  evidence.json
  session.json
  performance.json
  environment.json
  README.txt
```

## UI

- Vietnamese label: **Xuất gói Review**
- Success status: **Đã tạo gói Review.**
- Also triggers browser download of the same ZIP

## Out of scope (confirmed)

No AI / OCR / Knowledge Learning / Workflow / Login / Cloud Sync / Analytics Server / API redesign.
