export type { BBox, LocateQuery, PointHit, TextRegion } from './types';
export type { ITextLocator } from './locator';
export {
  createGeometricTextLocator,
  GEOMETRIC_LOCATOR_ID,
  GEOMETRIC_LOCATOR_VERSION,
} from './geometric-locator';
export {
  LocatorRegistry,
  createDefaultLocatorRegistry,
  getDefaultLocatorRegistry,
  resetDefaultLocatorRegistryForTests,
} from './registry';
export { hitPrimitiveIdsFromDomSelection } from './presentation/dom-hit';
export type { DomHitContext } from './presentation/dom-hit';
