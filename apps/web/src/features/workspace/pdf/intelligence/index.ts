export { isDoiEngineEnabled, DOI_ENGINE_FLAG } from './feature-flag';
export {
  createPdfTextLayerAdapter,
  PDF_TEXT_LAYER_ADAPTER_ID,
} from './adapters';
export type { InputAdapter, AdapterFormat } from './adapters';
export type {
  DocumentPrimitive,
  DocumentPrimitivePage,
  TextProvenance,
  TextSourceKind,
} from './dpl';
export {
  runDoiEngine,
  DOI_ENGINE_VERSION,
  getDefaultDoiDetectorRegistry,
  clearDoiCache,
} from './doi';
export type { DocumentObjectGraph, ObjectDiagnostics, ClassifiedObject } from './doi';
export {
  createDefaultInputRegistry,
  getDefaultInputRegistry,
  createInputRuntime,
  getDefaultInputRuntime,
  createPdfTextProvider,
  PDF_TEXT_PROVIDER_ID,
  PDF_TEXT_CAPABILITY_ID,
  textPrimitivePageToGeomItems,
  textPrimitivePageToDpl,
  InputCapabilityRegistry,
} from './input';
export type {
  IInputProvider,
  DocumentInput,
  TextPrimitive,
  TextPrimitivePage,
  InputRuntime,
  ProviderCapability,
} from './input';

/** EVO-003…008 architecture surfaces */
export {
  createGeometricTextLocator,
  getDefaultLocatorRegistry,
  LocatorRegistry,
  GEOMETRIC_LOCATOR_ID,
} from './locator';
export type { ITextLocator, TextRegion } from './locator';
export { createDerivedProvenance } from './derived';
export type { DerivedText, DerivationMetadata } from './derived';
export {
  createDefaultGovernedRegistry,
  getDefaultGovernedRegistry,
  isCapabilityRunnable,
} from './governance';
export type { GovernedCapability } from './governance';
export {
  executeResolutionPipeline,
  defaultEmbeddedResolutionPlan,
} from './resolution';
export type { ResolutionPlan } from './resolution';
export {
  toKnowledgeTextUnit,
  toPresentationHit,
  assertKnowledgeOnly,
  assertPresentationOnly,
} from './separation';
export type { KnowledgeTextUnit, PresentationHit } from './separation';
export {
  createDefaultPluginHost,
  getDefaultPluginHost,
  PluginHost,
} from './plugin-sdk';
