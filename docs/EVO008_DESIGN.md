# EVO008_DESIGN.md

## Plugin kinds
provider | locator | normalizer | exporter | reviewer | derived-producer

## Host API
register · list(kind?) · getProvider · getLocator · listEnabledDerivedProducers

## Migration
New capabilities register via PluginHost + GovernedCapabilityRegistry — never hardcode engines in DOI.
