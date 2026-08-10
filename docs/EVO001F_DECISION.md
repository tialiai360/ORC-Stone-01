# EVO001F_DECISION.md

> **EVO-001F** Decision Record  
> Date: 2026-07-18  
> Wave: Document Region Engine  
> Design + Implementation AUTHORIZED

---

## Decision

### **READY WITH CONDITIONS**

### Continue: **STOP** (await next evolution authorization)

---

## Summary

Stone-01 Document Understanding Pipeline is now **Region-first**:

```
Page → Region Engine (plugins) → Objects → Region RO → Selection → Knowledge/Presentation
```

- `DocumentRegionGraph` is layout Source of Truth on each `PageStructureModel`  
- Default bands: Header · Main · Footer · Margin (+ Appendix / Attachment / Metadata)  
- Pluggable `RegionPluginManager`  
- Selection constrained to dominant region  
- **Năng lực tài liệu** capability panel in Workbench  
- Absolute Locks held (no OCR/AI, raw immutable, UX/DIL/KPL unchanged)

## Conditions

1. Full hierarchical Knowledge Structure Tree UI not yet replacing node tree  
2. Image/chart/QR remain cue/flag-level inside objects  
3. Not claiming full banking OCR-less parity on scanned pages without text layer  
4. Large-doc virtualization still page-window based  

## Evidence

| Gate | Result |
|---|---|
| Architecture docs | PASS |
| Implementation | PASS (foundation) |
| Typecheck | PASS |
| Unit tests | **24/24** |
| Scorecard | 4.1 / 5 |
| Locks | PASS |

## STOP

EVO-001F foundation closed. Further depth (structure tree UX, richer media detectors) needs a follow-on wave.
