export type {
  AdapterSource,
  DocumentPrimitive,
  DocumentPrimitivePage,
  PrimitiveKind,
  RgbColor,
  TextProvenance,
  TextSourceKind,
} from './types';
export {
  clamp01,
  normalizePrimitive,
  normalizePrimitivePage,
  normalizeRotation,
  normalizeUnicode,
  parseCssRgb,
} from './normalize';
export { extractPrimitivesFromTextItems } from './extract-from-text-items';
export { extractAnnotationPrimitives } from './extract-annotations';
