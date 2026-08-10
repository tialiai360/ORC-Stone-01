import {
  createGeometricTextLocator,
  GEOMETRIC_LOCATOR_ID,
} from '../locator/geometric-locator';
import { createPdfTextProvider, PDF_TEXT_PROVIDER_ID } from '../input/providers/pdf-text-provider';
import {
  createIdentityNormalizerPlugin,
  PluginHost,
  type IPlugin,
} from './types';

export function createDefaultPluginHost(): PluginHost {
  const host = new PluginHost();

  const providerPlugin: IPlugin = {
    manifest: {
      id: PDF_TEXT_PROVIDER_ID,
      version: '1.0.0',
      kind: 'provider',
      labelVi: 'PDF embedded text',
      enabled: true,
    },
  };
  host.register({ kind: 'provider', plugin: providerPlugin, impl: createPdfTextProvider() });

  const locatorPlugin: IPlugin = {
    manifest: {
      id: GEOMETRIC_LOCATOR_ID,
      version: '1.0.0',
      kind: 'locator',
      labelVi: 'Geometric locator',
      enabled: true,
    },
  };
  host.register({
    kind: 'locator',
    plugin: locatorPlugin,
    impl: createGeometricTextLocator(),
  });

  host.register({
    kind: 'normalizer',
    plugin: createIdentityNormalizerPlugin(),
    impl: createIdentityNormalizerPlugin(),
  });

  return host;
}

let singleton: PluginHost | null = null;

export function getDefaultPluginHost(): PluginHost {
  if (!singleton) {
    singleton = createDefaultPluginHost();
  }
  return singleton;
}

export function resetDefaultPluginHostForTests(): void {
  singleton = null;
}
