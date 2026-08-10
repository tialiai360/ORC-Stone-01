# DIL001 REVIEW — Document Intelligence Layer Foundation

**Lab:** DIL-001  
**Repo:** `ORC-Stone-01`  
**Date:** 2026-07-18  

## Purpose

Improve Vietnamese PDF text extraction quality, preserve structure/symbols, measure confidence, and keep humans in control of every correction.  
Not OCR replacement. Not AI. Not LLM.

## Pipeline delivered

PDF → Parser → Raw Text → Character Preservation → Vietnamese Normalization → Structure Recovery → Confidence → Human Validation → (ready for Knowledge Extraction)

## Features

| # | Feature | Status |
|---|---|---|
| 1 | Raw + Normalized stored separately | Done |
| 2 | Character / marker preservation | Done |
| 3 | Vietnamese normalization (no word auto-fix) | Done |
| 4 | Per-block confidence 0–100 | Done |
| 5 | Workspace low-confidence yellow border + tooltip | Done |
| 6 | Suspicious text mark-only | Done |
| 7 | Knowledge Pack interface (+ thin seed packs) | Done |
| 8 | Correction suggestion Chấp nhận / Bỏ qua | Done |
| 9 | DilTextCorrected evidence | Done |
| 10 | Review Package DIL JSON files | Done |

## API

- `GET /dil/packs`
- `POST /dil/:documentId` (optional `?force=1`)
- `GET /dil/:documentId`
- `POST /dil/:documentId/corrections`

## Storage

`storage/dil/{documentId}.json`

## Code

`apps/api/src/document-intelligence/`
