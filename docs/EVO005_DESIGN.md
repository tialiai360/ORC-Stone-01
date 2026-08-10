# EVO005_DESIGN.md

## GovernedCapability fields
state · owner · version · approval{approvedBy,approvedAt,decisionRef} · policy{allowInProduction,requiresHumanAccept,markAsDerived} · dependencies[]

## Runnable gate
`enabled && (enabled|approved) && allowInProduction`
