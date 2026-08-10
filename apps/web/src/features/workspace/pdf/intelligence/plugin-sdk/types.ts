/**
 * EVO-008 — Plugin SDK (extension points).
 * Providers · Locators · Normalizers · Exporters · Reviewers
 */

import type { IInputProvider } from '../input/provider';
import type { ITextLocator } from '../locator/locator';
import type { TextPrimitivePage } from '../input/types';
import type { IDerivedTextProducer } from '../derived/types';

export type PluginKind =
  | 'provider'
  | 'locator'
  | 'normalizer'
  | 'exporter'
  | 'reviewer'
  | 'derived-producer';

export type PluginManifest = {
  id: string;
  version: string;
  kind: PluginKind;
  labelVi: string;
  enabled: boolean;
};

export interface IPlugin {
  readonly manifest: PluginManifest;
}

export interface INormalizerPlugin extends IPlugin {
  normalize(page: TextPrimitivePage): TextPrimitivePage;
}

/** Export artifact builder — must not mutate Review Package schema. */
export interface IExporterPlugin extends IPlugin {
  exportKind: string;
  /** Opaque payload builder for future formats; default no-op verify. */
  canExport(input: unknown): boolean;
}

/** Review assist — human-final; no auto-approve. */
export interface IReviewerPlugin extends IPlugin {
  reviewKind: string;
  validateSnapshot(input: unknown): { ok: boolean; reasons: string[] };
}

export type PluginRegistration =
  | { kind: 'provider'; plugin: IPlugin; impl: IInputProvider }
  | { kind: 'locator'; plugin: IPlugin; impl: ITextLocator }
  | { kind: 'normalizer'; plugin: IPlugin; impl: INormalizerPlugin }
  | { kind: 'exporter'; plugin: IPlugin; impl: IExporterPlugin }
  | { kind: 'reviewer'; plugin: IPlugin; impl: IReviewerPlugin }
  | { kind: 'derived-producer'; plugin: IPlugin; impl: IDerivedTextProducer };

export class PluginHost {
  private plugins: PluginRegistration[] = [];

  register(reg: PluginRegistration): void {
    this.plugins = [
      ...this.plugins.filter((p) => p.plugin.manifest.id !== reg.plugin.manifest.id),
      reg,
    ];
  }

  list(kind?: PluginKind): PluginManifest[] {
    return this.plugins
      .filter((p) => (kind ? p.kind === kind : true))
      .filter((p) => p.plugin.manifest.enabled)
      .map((p) => ({ ...p.plugin.manifest }));
  }

  getProvider(id: string): IInputProvider | undefined {
    const hit = this.plugins.find(
      (p) => p.kind === 'provider' && p.plugin.manifest.id === id,
    );
    return hit && hit.kind === 'provider' ? hit.impl : undefined;
  }

  getLocator(id: string): ITextLocator | undefined {
    const hit = this.plugins.find(
      (p) => p.kind === 'locator' && p.plugin.manifest.id === id,
    );
    return hit && hit.kind === 'locator' ? hit.impl : undefined;
  }

  /** Derived producers: none enabled by default. */
  listEnabledDerivedProducers(): IDerivedTextProducer[] {
    return this.plugins
      .filter((p) => p.kind === 'derived-producer' && p.plugin.manifest.enabled)
      .map((p) => (p.kind === 'derived-producer' ? p.impl : null))
      .filter((p): p is IDerivedTextProducer => Boolean(p) && p!.isEnabled());
  }
}

/** Identity normalizer — architecture verification. */
export function createIdentityNormalizerPlugin(): INormalizerPlugin {
  return {
    manifest: {
      id: 'plugin.normalizer.identity.v1',
      version: '1.0.0',
      kind: 'normalizer',
      labelVi: 'Normalizer đồng nhất',
      enabled: true,
    },
    normalize(page) {
      return page;
    },
  };
}
