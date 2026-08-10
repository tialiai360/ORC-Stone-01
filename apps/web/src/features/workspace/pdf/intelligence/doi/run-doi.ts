/**
 * DOI Engine entry — Primitive → Features → Detectors → Fusion → Graph.
 * Provider-agnostic: accepts DPL page or extracts via Input Runtime.
 */

import type { DocumentPrimitivePage } from '../dpl/types';
import { getDefaultInputRuntime } from '../input/runtime';
import { getDefaultDoiDetectorRegistry } from './detectors';
import { extractFeatures } from './features';
import { fusePrimitiveEvidence } from './fusion';
import {
  buildObjectCapabilities,
  buildObjectDiagnostics,
  buildRelations,
} from './graph';
import { doiCacheKey, getCachedDoiGraph, setCachedDoiGraph } from './cache';
import type { DocumentObjectGraph } from './types';

export const DOI_ENGINE_VERSION = 'doi-engine/1.2.0';

export function runDoiEngine(args: {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  textItems?: import('../../types').TextItemGeom[];
  pageEl?: HTMLElement | null;
  primitives?: DocumentPrimitivePage;
}): DocumentObjectGraph {
  const primitives =
    args.primitives ??
    getDefaultInputRuntime().extractDplPage({
      documentId: `doi-${args.pageNumber}`,
      pageNumber: args.pageNumber,
      pageWidth: args.pageWidth,
      pageHeight: args.pageHeight,
      context: {
        textItems: args.textItems,
        pageEl: args.pageEl,
      },
    });

  const key = doiCacheKey(args.pageNumber, primitives.fingerprint);
  const cached = getCachedDoiGraph(key);
  if (cached) {
    return cached;
  }

  const features = extractFeatures(primitives);
  const registry = getDefaultDoiDetectorRegistry();
  const evidence = registry.run({ page: primitives, features });

  const objects = primitives.primitives.map((p, i) =>
    fusePrimitiveEvidence({
      pageNumber: args.pageNumber,
      primitiveIndex: i,
      features: features[i]!,
      evidence,
      text: p.text,
      primitiveId: p.id,
      textItemId: p.textItemId,
    }),
  );

  const graph: DocumentObjectGraph = {
    pageNumber: args.pageNumber,
    pageWidth: args.pageWidth,
    pageHeight: args.pageHeight,
    fingerprint: primitives.fingerprint,
    primitives,
    objects,
    relations: buildRelations(objects),
    diagnostics: buildObjectDiagnostics(
      objects,
      primitives.primitives.length,
      registry.list().length,
    ),
    capabilities: buildObjectCapabilities(objects),
    engineVersion: DOI_ENGINE_VERSION,
  };

  setCachedDoiGraph(key, graph);
  return graph;
}
