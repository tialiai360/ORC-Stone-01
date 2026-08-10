/**
 * EVO-001F Region Engine public API.
 */

export type {
  DocumentRegion,
  DocumentRegionGraph,
  DocumentRegionKind,
  DocumentObject,
  DocumentObjectType,
  RegionCapability,
  RegionDetectorPlugin,
  RegionDiagnostics,
} from './types';
export { REGION_LABELS_VI } from './types';
export {
  RegionPluginManager,
  getDefaultRegionPluginManager,
  resetRegionPluginManagerForTests,
  buildDocumentRegionGraph,
} from './registry';
export {
  buildRegionFirstReadingOrder,
  buildRegionSelectionBlocks,
  documentRegionsToStructureRegions,
} from './reading-order';
