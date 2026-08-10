'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'orc.workbench.layout.v3';

export type WorkbenchLayoutState = {
  leftOpen: boolean;
  rightOpen: boolean;
  leftWidth: number;
  rightWidth: number;
  pensCompact: boolean;
  evidenceOpen: boolean;
};

/**
 * Reborn user defaults: Evidence (PDF) closed on first paint so Work Desk fills the screen.
 * Open «Bằng chứng» when selecting text / locating.
 */
const DEFAULTS: WorkbenchLayoutState = {
  leftOpen: false,
  rightOpen: false,
  leftWidth: 200,
  rightWidth: 480,
  pensCompact: false,
  evidenceOpen: true,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function load(): WorkbenchLayoutState {
  if (typeof window === 'undefined') {
    return DEFAULTS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULTS;
    }
    const parsed = JSON.parse(raw) as Partial<WorkbenchLayoutState>;
    return {
      leftOpen: parsed.leftOpen ?? DEFAULTS.leftOpen,
      rightOpen: parsed.rightOpen ?? DEFAULTS.rightOpen,
      leftWidth: clamp(parsed.leftWidth ?? DEFAULTS.leftWidth, 160, 360),
      rightWidth: clamp(parsed.rightWidth ?? DEFAULTS.rightWidth, 280, 640),
      pensCompact: parsed.pensCompact ?? DEFAULTS.pensCompact,
      evidenceOpen: parsed.evidenceOpen ?? DEFAULTS.evidenceOpen,
    };
  } catch {
    return DEFAULTS;
  }
}

export function useWorkbenchLayout() {
  const [layout, setLayout] = useState<WorkbenchLayoutState>(DEFAULTS);
  const preFocusRef = useRef<WorkbenchLayoutState | null>(null);

  useEffect(() => {
    setLayout(load());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      /* ignore */
    }
  }, [layout]);

  const toggleLeft = useCallback(() => {
    setLayout((s) => ({ ...s, leftOpen: !s.leftOpen }));
  }, []);

  const toggleRight = useCallback(() => {
    setLayout((s) => ({ ...s, rightOpen: !s.rightOpen }));
  }, []);

  const toggleEvidence = useCallback(() => {
    setLayout((s) => ({ ...s, evidenceOpen: !s.evidenceOpen }));
  }, []);

  const setLeftWidth = useCallback((w: number) => {
    setLayout((s) => ({ ...s, leftWidth: clamp(w, 160, 360) }));
  }, []);

  const setRightWidth = useCallback((w: number) => {
    setLayout((s) => ({ ...s, rightWidth: clamp(w, 280, 640) }));
  }, []);

  const applyFocusChrome = useCallback((on: boolean) => {
    if (on) {
      setLayout((s) => {
        preFocusRef.current = { ...s };
        return {
          ...s,
          leftOpen: false,
          rightOpen: false,
          pensCompact: true,
          evidenceOpen: false,
        };
      });
      return;
    }
    const snap = preFocusRef.current;
    preFocusRef.current = null;
    if (snap) {
      setLayout(snap);
    } else {
      setLayout((s) => ({
        ...s,
        leftOpen: true,
        rightOpen: true,
        pensCompact: false,
        evidenceOpen: true,
      }));
    }
  }, []);

  const exitFocusRestore = useCallback(() => {
    applyFocusChrome(false);
  }, [applyFocusChrome]);

  return {
    layout,
    toggleLeft,
    toggleRight,
    toggleEvidence,
    setLeftWidth,
    setRightWidth,
    applyFocusChrome,
    exitFocusRestore,
  };
}
