'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
  DetectedModule,
  ModuleVisualState,
  StructureModuleId,
  WorkspaceViewMode,
} from '../pdf/plugins/types';

export type ModulePresentationMap = Record<StructureModuleId, ModuleVisualState>;

const DEFAULT_STATE: ModuleVisualState = {
  visible: true,
  highlight: false,
  focus: false,
};

/** Layers stripped on open (reading/focus) — keep body text only. */
export const CONTENT_ONLY_HIDE: StructureModuleId[] = [
  'header',
  'footer',
  'watermark',
  'repeated-header',
  'repeated-footer',
  'page-number',
  'logo',
  'stamp',
  'signature',
  'digital-signature',
  'qr-code',
  'barcode',
  'rotated-text',
  'annotation-layer',
  'footnote',
  'image',
  'sidebar',
];

function blankMap(): Partial<ModulePresentationMap> {
  return {};
}

function modePreset(mode: WorkspaceViewMode): Partial<ModulePresentationMap> {
  const hide = (ids: StructureModuleId[]): Partial<ModulePresentationMap> => {
    const out: Partial<ModulePresentationMap> = {};
    for (const id of ids) {
      out[id] = { visible: false, highlight: false, focus: false };
    }
    return out;
  };
  const show = (
    ids: StructureModuleId[],
    highlight = false,
  ): Partial<ModulePresentationMap> => {
    const out: Partial<ModulePresentationMap> = {};
    for (const id of ids) {
      out[id] = { visible: true, highlight, focus: false };
    }
    return out;
  };

  switch (mode) {
    case 'authoring':
      return {
        ...hide([
          'header',
          'footer',
          'watermark',
          'repeated-header',
          'repeated-footer',
          'page-number',
        ]),
        ...show(['table', 'article', 'clause', 'point', 'subject', 'legal-basis'], true),
        ...show(['signature', 'digital-signature', 'qr-code'], false),
      };
    case 'reading':
    case 'focus':
      // Open/read: peel chrome + security layers; body text (untagged) stays.
      return {
        ...hide(CONTENT_ONLY_HIDE),
        ...show(
          [
            'table',
            'article',
            'clause',
            'point',
            'subject',
            'legal-basis',
            'annex',
            'selectable-text-layer',
          ],
          false,
        ),
      };
    case 'review':
      return {
        ...show(
          [
            'header',
            'footer',
            'watermark',
            'table',
            'signature',
            'digital-signature',
            'qr-code',
            'logo',
            'stamp',
            'footnote',
            'page-number',
            'article',
            'subject',
            'legal-basis',
            'annex',
          ],
          false,
        ),
      };
    case 'normal':
    default:
      return blankMap();
  }
}

/**
 * Single-purpose presentation controls (raw PDF immutable).
 * Default mode = reading: open document → content text only (layers peeled).
 */
export function useStructurePresentation(detected: DetectedModule[]) {
  const [mode, setMode] = useState<WorkspaceViewMode>('reading');
  const [overrides, setOverrides] = useState<Partial<ModulePresentationMap>>({});
  const [isolatedId, setIsolatedId] = useState<StructureModuleId | null>(null);

  const presentation = useMemo(() => {
    const preset = modePreset(mode);
    const map: Partial<ModulePresentationMap> = {};
    for (const m of detected) {
      const base: ModuleVisualState = {
        ...DEFAULT_STATE,
        ...preset[m.moduleId],
        ...overrides[m.moduleId],
      };
      if (isolatedId) {
        const on = m.moduleId === isolatedId;
        map[m.moduleId] = {
          ...base,
          visible: on,
          highlight: on,
          focus: on,
        };
      } else {
        map[m.moduleId] = { ...base, focus: false };
      }
    }
    return map;
  }, [detected, mode, overrides, isolatedId]);

  const setViewMode = useCallback((next: WorkspaceViewMode) => {
    setMode(next);
    setOverrides({});
    setIsolatedId(null);
  }, []);

  /** Reset to content-only when opening another document. */
  const resetToContentOnly = useCallback(() => {
    setMode('reading');
    setOverrides({});
    setIsolatedId(null);
  }, []);

  const toggleVisible = useCallback(
    (id: StructureModuleId) => {
      if (isolatedId && isolatedId !== id) {
        return;
      }
      if (isolatedId === id) {
        setIsolatedId(null);
        return;
      }
      setOverrides((prev) => {
        const cur = prev[id] ?? presentation[id] ?? DEFAULT_STATE;
        return {
          ...prev,
          [id]: { ...cur, visible: !cur.visible },
        };
      });
    },
    [presentation, isolatedId],
  );

  const toggleHighlight = useCallback(
    (id: StructureModuleId) => {
      if (isolatedId && isolatedId !== id) {
        return;
      }
      setOverrides((prev) => {
        const cur = prev[id] ?? presentation[id] ?? DEFAULT_STATE;
        return {
          ...prev,
          [id]: { ...cur, highlight: !cur.highlight },
        };
      });
    },
    [presentation, isolatedId],
  );

  const locateModule = useCallback(
    (id: StructureModuleId) => {
      setIsolatedId(null);
      setOverrides((prev) => {
        const next: Partial<ModulePresentationMap> = { ...prev };
        for (const m of detected) {
          const cur = next[m.moduleId] ?? presentation[m.moduleId] ?? DEFAULT_STATE;
          next[m.moduleId] = {
            ...cur,
            visible: m.moduleId === id ? true : cur.visible,
            highlight: m.moduleId === id,
            focus: false,
          };
        }
        return next;
      });
    },
    [detected, presentation],
  );

  const revealModule = locateModule;

  const isolateModule = useCallback((id: StructureModuleId) => {
    setIsolatedId((prev) => (prev === id ? null : id));
  }, []);

  const focusModule = isolateModule;

  const clearIsolate = useCallback(() => {
    setIsolatedId(null);
  }, []);

  const clearHighlights = useCallback(() => {
    setIsolatedId(null);
    setOverrides((prev) => {
      const next: Partial<ModulePresentationMap> = { ...prev };
      for (const m of detected) {
        const cur = next[m.moduleId] ?? presentation[m.moduleId] ?? DEFAULT_STATE;
        if (cur.highlight || cur.focus) {
          next[m.moduleId] = { ...cur, highlight: false, focus: false };
        }
      }
      return next;
    });
  }, [detected, presentation]);

  return {
    mode,
    setViewMode,
    resetToContentOnly,
    presentation,
    isolatedId,
    toggleVisible,
    toggleHighlight,
    locateModule,
    revealModule,
    isolateModule,
    focusModule,
    clearIsolate,
    clearHighlights,
    showSelectionBlocks: mode === 'authoring',
    highlightParagraphs: mode === 'authoring',
  };
}

export function isModuleHidden(
  presentation: Partial<ModulePresentationMap>,
  moduleId: string | undefined,
): boolean {
  if (!moduleId) {
    return false;
  }
  const st = presentation[moduleId as StructureModuleId];
  return st ? !st.visible : false;
}

export function isIsolateActive(presentation: Partial<ModulePresentationMap>): boolean {
  return Object.values(presentation).some((s) => Boolean(s?.focus));
}

export function isItemVisibleInPresentation(
  presentation: Partial<ModulePresentationMap>,
  moduleId: string | undefined,
): boolean {
  if (isIsolateActive(presentation)) {
    if (!moduleId) {
      return false;
    }
    return Boolean(presentation[moduleId as StructureModuleId]?.focus);
  }
  return !isModuleHidden(presentation, moduleId);
}

export function isModuleHighlighted(
  presentation: Partial<ModulePresentationMap>,
  moduleId: string | undefined,
): boolean {
  if (!moduleId) {
    return false;
  }
  const st = presentation[moduleId as StructureModuleId];
  return Boolean(st?.highlight || st?.focus);
}
