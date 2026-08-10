'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ClassificationAssignment,
  KNOWLEDGE_NODES,
  type AssignmentStructureRef,
} from '@orc/shared';
import type { SessionEvent } from '../../review';
import { findSimilarFragments } from '../similar-fragments';

type HintState = {
  open: boolean;
  x: number;
  y: number;
  text: string;
  pageNumber: number;
  structureRef?: AssignmentStructureRef;
};

type SuggestionState = {
  open: boolean;
  nodeId: string;
  pageNumber: number;
  fragments: string[];
  sample: string;
};

type UseAssignFlowArgs = {
  assignments: ClassificationAssignment[];
  setAssignments: Dispatch<SetStateAction<ClassificationAssignment[]>>;
  pushHistory: (current: ClassificationAssignment[]) => void;
  setDirty: (v: boolean) => void;
  setStatus: (s: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setFocusedAssignmentId: (id: string | null) => void;
  flashNode: (nodeId: string) => void;
  bumpAssignCount: () => void;
  onEvent: (type: SessionEvent['type'], detail?: string) => void;
};

const emptyHint: HintState = {
  open: false,
  x: 0,
  y: 0,
  text: '',
  pageNumber: 1,
  structureRef: undefined,
};
const emptySuggestion: SuggestionState = {
  open: false,
  nodeId: '',
  pageNumber: 1,
  fragments: [],
  sample: '',
};

export function useAssignFlow({
  assignments,
  setAssignments,
  pushHistory,
  setDirty,
  setStatus,
  setSelectedNodeId,
  setFocusedAssignmentId,
  flashNode,
  bumpAssignCount,
  onEvent,
}: UseAssignFlowArgs) {
  const [pageTexts, setPageTexts] = useState<Record<number, string>>({});
  const [hint, setHint] = useState<HintState>(emptyHint);
  const [suggestion, setSuggestion] = useState<SuggestionState>(emptySuggestion);

  const onViewerPageText = useCallback((page: number, text: string) => {
    setPageTexts((prev) => (prev[page] === text ? prev : { ...prev, [page]: text }));
  }, []);

  const maybeSuggestSimilar = useCallback(
    (nodeId: string, text: string, pageNumber: number) => {
      const corpus = pageTexts[pageNumber] ?? '';
      const fragments = findSimilarFragments(text, corpus).filter(
        (f) =>
          !assignments.some(
            (a) => a.nodeId === nodeId && a.text.replace(/\s+/g, ' ').trim() === f,
          ),
      );
      if (fragments.length === 0) {
        return;
      }
      setSuggestion({
        open: true,
        nodeId,
        pageNumber,
        fragments,
        sample: fragments[0] ?? text,
      });
    },
    [assignments, pageTexts],
  );

  const assignSelection = useCallback(
    (
      nodeId: string,
      text: string,
      pageNumber: number,
      opts?: {
        skipSuggest?: boolean;
        structureRef?: AssignmentStructureRef;
        source?: 'auto' | 'manual';
      },
    ) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      pushHistory(assignments);
      const next: ClassificationAssignment = {
        id: crypto.randomUUID(),
        nodeId,
        text: trimmed,
        pageNumber,
        createdAt: new Date().toISOString(),
        source: opts?.source ?? 'manual',
        structureRef: opts?.structureRef,
      };
      setAssignments([...assignments, next]);
      setSelectedNodeId(nodeId);
      setFocusedAssignmentId(next.id);
      flashNode(nodeId);
      setDirty(true);
      setStatus('Đã tô — chưa lưu');
      onEvent('assign', nodeId);
      onEvent('highlight', `trang ${pageNumber}`);
      bumpAssignCount();
      setHint((h) => ({ ...h, open: false }));
      window.getSelection()?.removeAllRanges();
      if (!opts?.skipSuggest) {
        maybeSuggestSimilar(nodeId, trimmed, pageNumber);
      }
    },
    [
      assignments,
      bumpAssignCount,
      flashNode,
      maybeSuggestSimilar,
      onEvent,
      pushHistory,
      setAssignments,
      setDirty,
      setFocusedAssignmentId,
      setSelectedNodeId,
      setStatus,
    ],
  );

  const applySimilarYes = useCallback(() => {
    const { nodeId, pageNumber, fragments } = suggestion;
    setSuggestion((s) => ({ ...s, open: false }));
    if (fragments.length === 0) {
      return;
    }
    pushHistory(assignments);
    const now = new Date().toISOString();
    const added: ClassificationAssignment[] = fragments.map((frag) => ({
      id: crypto.randomUUID(),
      nodeId,
      text: frag,
      pageNumber,
      createdAt: now,
      source: 'manual' as const,
    }));
    setAssignments([...assignments, ...added]);
    setSelectedNodeId(nodeId);
    flashNode(nodeId);
    setDirty(true);
    setStatus(`Đã áp dụng ${added.length} đoạn tương tự — chưa lưu`);
    onEvent('assign', `tuong-tu:${added.length}`);
    bumpAssignCount();
  }, [
    assignments,
    bumpAssignCount,
    flashNode,
    onEvent,
    pushHistory,
    setAssignments,
    setDirty,
    setSelectedNodeId,
    setStatus,
    suggestion,
  ]);

  const dismissSimilar = useCallback(() => {
    setSuggestion((s) => ({ ...s, open: false }));
  }, []);

  const onTextSelected = useCallback(
    ({
      text,
      pageNumber,
      clientX,
      clientY,
      structureRef,
    }: {
      text: string;
      pageNumber: number;
      clientX: number;
      clientY: number;
      structureRef?: AssignmentStructureRef;
    }) => {
      setHint({
        open: true,
        x: clientX,
        y: clientY,
        text,
        pageNumber,
        structureRef,
      });
    },
    [],
  );

  const closeHint = useCallback(() => {
    setHint((h) => ({ ...h, open: false }));
  }, []);

  const selectPen = useCallback(
    (id: string | null, setActivePenId: (id: string | null) => void) => {
      setActivePenId(id);
      if (id) {
        setSelectedNodeId(id);
        const node = KNOWLEDGE_NODES.find((n) => n.id === id);
        setStatus(node ? `Bút: ${node.label}` : 'Đang tô');
      } else {
        setStatus('Đã hủy bút');
      }
    },
    [setSelectedNodeId, setStatus],
  );

  return {
    hint,
    suggestion,
    pageTexts,
    assignSelection,
    applySimilarYes,
    dismissSimilar,
    onTextSelected,
    onViewerPageText,
    closeHint,
    selectPen,
  };
}
