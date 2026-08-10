# EVO001_DECISION.md

> **EVO-001** Decision Record  
> Date: 2026-07-18  
> Wave: Stone-01 Final Evolution — Document Workbench tranche 1

---

## Decision

### **READY WITH CONDITIONS**

### Continue: **STOP** (await user direction for tranche 2)

---

## Summary

Stone-01 evolved from a fixed “PDF + annotation sidebar” into a **Knowledge-centric Document Workbench** shell:

- Resizable / collapsible Outline + Knowledge panels  
- Modes: Thường · Soạn · Duyệt · Đọc · **Focus**  
- Knowledge Workspace (progress, missing, mapping)  
- Document Outline (pages, legal structure, recent)  
- DPK-001 bridge (`MOD-*` / ontology class) + regex legal structure detector  
- Selection → optional `structureRef` on Knowledge assignments  

Absolute Locks (DIL / KPL / UX-001 / no OCR-AI / raw immutable) **held**.

---

## Conditions

1. Not claiming full Adobe/Foxit parity — continuous scroll, mini-map thumbnails, full VR panel deferred.  
2. Not claiming “DPK-001 complete/compliant” — alignment bridge only.  
3. Legal numbering heuristics may false-positive on plain lists — human-final remains.  
4. Tranche 2 (optional): virtualization, richer header ontology split, validation UI.

---

## Evidence

| Gate | Result |
|---|---|
| Analyze / Architecture docs | PASS |
| Implementation | PASS (tranche 1) |
| Typecheck `@orc/web` | PASS |
| Unit tests web | PASS |
| Audit | PASS WITH CONDITIONS |
| Scorecard | 3.8 / 5 |

---

## STOP

EVO-001 tranche 1 closed. Further workbench depth requires explicit continuation.
