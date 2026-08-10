'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ShortcutHelperMode } from '../shortcut-helper';

const ASSIGN_COUNT_KEY = 'orc-ux-assign-count';

export function helperModeFromCount(count: number): ShortcutHelperMode {
  if (count < 8) {
    return 'full';
  }
  if (count < 25) {
    return 'compact';
  }
  return 'hidden';
}

/** Progressive shortcut helper: full → compact → hidden; `?` force-show. */
export function useProgressiveGuide() {
  const [assignCount, setAssignCount] = useState(0);
  const [forceGuide, setForceGuide] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ASSIGN_COUNT_KEY);
      setAssignCount(raw ? Number(raw) || 0 : 0);
    } catch {
      setAssignCount(0);
    }
  }, []);

  const bumpAssignCount = useCallback(() => {
    setAssignCount((c) => {
      const next = c + 1;
      try {
        window.localStorage.setItem(ASSIGN_COUNT_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleForceGuide = useCallback(() => {
    setForceGuide((v) => !v);
  }, []);

  return {
    assignCount,
    helperMode: helperModeFromCount(assignCount),
    forceGuide,
    setForceGuide,
    toggleForceGuide,
    bumpAssignCount,
  };
}
