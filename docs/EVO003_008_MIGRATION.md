# EVO003_008_MIGRATION.md

## Compatibility Analysis (all waves)

| Surface | Change |
|---|---|
| Foundation / Canonical Laws | Untouched |
| Knowledge Runtime | Untouched |
| Review Package schema | Untouched |
| Evidence semantics / StructureCorrected | Untouched |
| Input Provider (EVO-002c) | Extended via Resolution Pipeline |
| selectionTextFromModel | Preserved (DOM presentation) |
| New APIs | Additive |

## Risk Assessment

| Risk | Mitigation |
|---|---|
| DOM leakage into Runtime | Locator core has no DOM; presentation helper isolated |
| Non-deterministic merge | first-id-wins + ordered steps |
| Accidental derived enable | PluginHost lists 0 derived; governance has no vision cap |
| Breaking callers | Deprecated paths kept; tests cover suites |

## Verification
`npm run test -w @orc/web` includes `evolution/evo-003-008.test.ts`
