/**
 * Master Evolution — feature flags (progressive enhancement only).
 * Absolute Locks unchanged; flags gate new intelligence layers.
 */

export const DOI_ENGINE_FLAG = 'orc.intel.doi.v1';

/** Default ON for Stone-01 evolution; can disable via localStorage = '0'. */
export function isDoiEngineEnabled(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  try {
    const v = window.localStorage.getItem(DOI_ENGINE_FLAG);
    if (v === '0' || v === 'false') {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}
