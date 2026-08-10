'use client';

import { useEffect, type MutableRefObject } from 'react';
import {
  KNOWLEDGE_NODES,
  nodeByShortcutDigit,
  type AssignmentStructureRef,
} from '@orc/shared';
import type { PdfSelectionBridge } from '../pdf/viewer-types';

type UseWorkspaceShortcutsArgs = {
  viewerPage: number;
  numPages: number;
  assignSelection: (
    nodeId: string,
    text: string,
    pageNumber: number,
    opts?: { structureRef?: AssignmentStructureRef },
  ) => void;
  save: () => void | Promise<void>;
  undo: () => void;
  redo: () => void;
  setActivePenId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setStatus: (s: string) => void;
  closeHint: () => void;
  toggleForceGuide: () => void;
  selectionBridgeRef: MutableRefObject<PdfSelectionBridge | null>;
  /** Workbench additive shortcuts (not UX-001). */
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
  onToggleEvidence?: () => void;
  onToggleFocus?: () => void;
  onGoPage?: (page: number) => void;
  currentPage?: number;
};

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) {
    return false;
  }
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;
}

/** UX-001 locked: Esc, ?, Ctrl+1–9, Ctrl+S/Z/Y — do not change those bindings. */
export function useWorkspaceShortcuts({
  viewerPage,
  numPages,
  assignSelection,
  save,
  undo,
  redo,
  setActivePenId,
  setSelectedNodeId,
  setStatus,
  closeHint,
  toggleForceGuide,
  selectionBridgeRef,
  onToggleLeft,
  onToggleRight,
  onToggleEvidence,
  onToggleFocus,
  onGoPage,
  currentPage = viewerPage,
}: UseWorkspaceShortcutsArgs) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActivePenId(null);
        closeHint();
        return;
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        toggleForceGuide();
        return;
      }
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const node = nodeByShortcutDigit(e.key);
        if (!node) {
          return;
        }
        const captured = selectionBridgeRef.current?.capture();
        if (captured?.text) {
          assignSelection(node.id, captured.text, captured.pageNumber, {
            structureRef: captured.structureRef,
          });
          setActivePenId(null);
        } else {
          setActivePenId(node.id);
          setSelectedNodeId(node.id);
          setStatus(`Bút: ${node.label}`);
        }
        return;
      }
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save();
        return;
      }
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (meta && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // —— Workbench additive (skip when typing) ——
      if (isTypingTarget(e.target)) {
        return;
      }
      if (e.altKey && e.key === '[') {
        e.preventDefault();
        onToggleLeft?.();
        return;
      }
      if (e.altKey && e.key === ']') {
        e.preventDefault();
        onToggleRight?.();
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onToggleEvidence?.();
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onToggleFocus?.();
        return;
      }
      if (e.key === 'PageUp' && onGoPage) {
        const sel = window.getSelection()?.toString();
        if (sel) {
          return;
        }
        e.preventDefault();
        onGoPage(Math.max(1, currentPage - 1));
        return;
      }
      if (e.key === 'PageDown' && onGoPage) {
        const sel = window.getSelection()?.toString();
        if (sel) {
          return;
        }
        e.preventDefault();
        onGoPage(Math.min(numPages || currentPage, currentPage + 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    assignSelection,
    closeHint,
    currentPage,
    numPages,
    onGoPage,
    onToggleEvidence,
    onToggleFocus,
    onToggleLeft,
    onToggleRight,
    redo,
    save,
    selectionBridgeRef,
    setActivePenId,
    setSelectedNodeId,
    setStatus,
    toggleForceGuide,
    undo,
    viewerPage,
  ]);
}

export function defaultSelectedNodeId(): string | null {
  return (
    KNOWLEDGE_NODES.find((n) => n.shortcutDigit === '1')?.id ?? KNOWLEDGE_NODES[0]?.id ?? null
  );
}
