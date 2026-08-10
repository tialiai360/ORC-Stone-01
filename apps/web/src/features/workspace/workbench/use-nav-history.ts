'use client';

import { useCallback, useState } from 'react';

export type NavLocation = {
  id: string;
  kind: 'page' | 'knowledge' | 'evidence' | 'outline';
  label: string;
  pageNumber?: number;
  nodeId?: string;
  at: number;
};

const MAX = 24;

export function useNavHistory() {
  const [stack, setStack] = useState<NavLocation[]>([]);

  const push = useCallback((loc: Omit<NavLocation, 'id' | 'at'>) => {
    setStack((prev) => {
      const next: NavLocation = {
        ...loc,
        id: `${loc.kind}-${loc.pageNumber ?? ''}-${loc.nodeId ?? ''}-${Date.now()}`,
        at: Date.now(),
      };
      const deduped = prev.filter(
        (p) =>
          !(
            p.kind === next.kind &&
            p.pageNumber === next.pageNumber &&
            p.nodeId === next.nodeId
          ),
      );
      return [next, ...deduped].slice(0, MAX);
    });
  }, []);

  const recent = stack.slice(0, 8);

  return { recent, push, clear: () => setStack([]) };
}
