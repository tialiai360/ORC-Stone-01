/**
 * Locator Registry — select ITextLocator by id / default geometric.
 */

import type { ITextLocator } from './locator';
import { createGeometricTextLocator, GEOMETRIC_LOCATOR_ID } from './geometric-locator';

export class LocatorRegistry {
  private locators = new Map<string, ITextLocator>();
  private defaultId: string = GEOMETRIC_LOCATOR_ID;

  register(locator: ITextLocator, asDefault = false): void {
    this.locators.set(locator.id, locator);
    if (asDefault) {
      this.defaultId = locator.id;
    }
  }

  get(id?: string): ITextLocator | undefined {
    return this.locators.get(id ?? this.defaultId);
  }

  default(): ITextLocator {
    const loc = this.locators.get(this.defaultId);
    if (!loc) {
      throw new Error(`Default locator missing: ${this.defaultId}`);
    }
    return loc;
  }

  list(): ITextLocator[] {
    return [...this.locators.values()];
  }
}

let singleton: LocatorRegistry | null = null;

export function createDefaultLocatorRegistry(): LocatorRegistry {
  const reg = new LocatorRegistry();
  reg.register(createGeometricTextLocator(), true);
  return reg;
}

export function getDefaultLocatorRegistry(): LocatorRegistry {
  if (!singleton) {
    singleton = createDefaultLocatorRegistry();
  }
  return singleton;
}

export function resetDefaultLocatorRegistryForTests(): void {
  singleton = null;
}
