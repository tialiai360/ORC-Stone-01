import type { DocumentObjectGraph } from './types';

const cache = new Map<string, DocumentObjectGraph>();

export function doiCacheKey(pageNumber: number, fingerprint: string): string {
  return `${pageNumber}|${fingerprint}`;
}

export function getCachedDoiGraph(key: string): DocumentObjectGraph | undefined {
  return cache.get(key);
}

export function setCachedDoiGraph(key: string, graph: DocumentObjectGraph): void {
  cache.set(key, graph);
  if (cache.size > 48) {
    const first = cache.keys().next().value;
    if (first) {
      cache.delete(first);
    }
  }
}

export function clearDoiCache(): void {
  cache.clear();
}
