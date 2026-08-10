/**
 * EVO-006 — Provider Resolution Pipeline (chaining).
 * Deterministic: ordered steps, stable merge by primitive id.
 */

import type { IInputProvider } from '../input/provider';
import type { DocumentInput, TextPrimitive, TextPrimitivePage } from '../input/types';
import type { InputCapabilityRegistry } from '../input/capability-registry';

export type ResolutionRole = 'primary' | 'fallback' | 'enrich';

export type ResolutionStep = {
  providerId: string;
  role: ResolutionRole;
};

export type ResolutionMode = 'first-success' | 'chain-merge';

export type ResolutionPlan = {
  mode: ResolutionMode;
  steps: ResolutionStep[];
};

function emptyPage(doc: DocumentInput, providerId: string): TextPrimitivePage {
  return {
    pageNumber: doc.pageNumber,
    pageWidth: doc.pageWidth || 1,
    pageHeight: doc.pageHeight || 1,
    primitives: [],
    fingerprint: `${providerId}:empty`,
    providerId,
  };
}

function mergePrimitives(pages: TextPrimitivePage[]): TextPrimitive[] {
  const byId = new Map<string, TextPrimitive>();
  for (const page of pages) {
    for (const p of page.primitives) {
      if (!byId.has(p.id)) {
        byId.set(p.id, p);
      }
    }
  }
  return [...byId.values()];
}

function fingerprintMerge(pages: TextPrimitivePage[]): string {
  return `merge:${pages.map((p) => p.fingerprint).join('+')}`;
}

/**
 * Resolve providers per plan. Missing providers are skipped (deterministic).
 */
export function executeResolutionPipeline(
  registry: InputCapabilityRegistry,
  doc: DocumentInput,
  plan: ResolutionPlan,
): TextPrimitivePage {
  const collected: TextPrimitivePage[] = [];

  for (const step of plan.steps) {
    const provider: IInputProvider | undefined = registry.getProvider(step.providerId);
    if (!provider || !provider.canProcess(doc)) {
      continue;
    }
    const page = provider.extractText(doc);
    if (plan.mode === 'first-success') {
      if (page.primitives.length > 0 || step.role === 'primary') {
        if (page.primitives.length > 0) {
          return page;
        }
        if (step.role === 'primary') {
          collected.push(page);
        }
      }
      continue;
    }
    // chain-merge
    if (step.role === 'primary' || step.role === 'fallback' || step.role === 'enrich') {
      collected.push(page);
      if (step.role === 'primary' && page.primitives.length > 0 && plan.mode === 'chain-merge') {
        // continue to enrich steps
      }
    }
  }

  if (plan.mode === 'first-success') {
    return collected[0] ?? emptyPage(doc, 'none');
  }

  if (collected.length === 0) {
    return emptyPage(doc, 'none');
  }
  if (collected.length === 1) {
    return collected[0]!;
  }

  const primitives = mergePrimitives(collected);
  return {
    pageNumber: doc.pageNumber,
    pageWidth: collected[0]!.pageWidth,
    pageHeight: collected[0]!.pageHeight,
    primitives,
    fingerprint: fingerprintMerge(collected),
    providerId: collected.map((c) => c.providerId).join('|'),
  };
}

/** Default plan: single embedded-text provider. */
export function defaultEmbeddedResolutionPlan(): ResolutionPlan {
  return {
    mode: 'first-success',
    steps: [{ providerId: 'provider.pdf-text.v1', role: 'primary' }],
  };
}
