/**
 * Input Runtime — DI surface; uses Resolution Pipeline (EVO-006).
 */

import { textPrimitivePageToDpl } from './bridge-to-dpl';
import type { InputCapabilityRegistry } from './capability-registry';
import { getDefaultInputRegistry } from './create-default-registry';
import type { DocumentInput, TextPrimitivePage } from './types';
import type { DocumentPrimitivePage } from '../dpl/types';
import {
  defaultEmbeddedResolutionPlan,
  executeResolutionPipeline,
  type ResolutionPlan,
} from '../resolution/pipeline';

export type InputRuntime = {
  registry: InputCapabilityRegistry;
  resolutionPlan: ResolutionPlan;
  extractPage(doc: DocumentInput): TextPrimitivePage;
  extractDplPage(doc: DocumentInput): DocumentPrimitivePage;
};

export function createInputRuntime(
  registry: InputCapabilityRegistry = getDefaultInputRegistry(),
  resolutionPlan: ResolutionPlan = defaultEmbeddedResolutionPlan(),
): InputRuntime {
  const extractPage = (doc: DocumentInput): TextPrimitivePage =>
    executeResolutionPipeline(registry, doc, resolutionPlan);
  return {
    registry,
    resolutionPlan,
    extractPage,
    extractDplPage(doc: DocumentInput): DocumentPrimitivePage {
      return textPrimitivePageToDpl(extractPage(doc));
    },
  };
}

let defaultRuntime: InputRuntime | null = null;

export function getDefaultInputRuntime(): InputRuntime {
  if (!defaultRuntime) {
    defaultRuntime = createInputRuntime();
  }
  return defaultRuntime;
}

export function resetDefaultInputRuntimeForTests(): void {
  defaultRuntime = null;
}
