export type {
  DocumentInput,
  ProviderCapability,
  TextPrimitive,
  TextPrimitivePage,
  TextProvenance,
  TextSourceKind,
} from './types';
export type { IInputProvider, RegisteredProvider } from './provider';
export { InputCapabilityRegistry } from './capability-registry';
export {
  createDefaultInputRegistry,
  getDefaultInputRegistry,
  resetDefaultInputRegistryForTests,
} from './create-default-registry';
export {
  createInputRuntime,
  getDefaultInputRuntime,
  resetDefaultInputRuntimeForTests,
} from './runtime';
export type { InputRuntime } from './runtime';
export {
  createPdfTextProvider,
  PDF_TEXT_PROVIDER_ID,
  PDF_TEXT_CAPABILITY_ID,
  PDF_TEXT_PROVIDER_VERSION,
  textPrimitivePageToGeomItems,
} from './providers/pdf-text-provider';
export { textPrimitivePageToDpl } from './bridge-to-dpl';
