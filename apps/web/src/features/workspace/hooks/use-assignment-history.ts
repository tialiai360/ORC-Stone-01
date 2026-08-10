'use client';

import { useCallback, useRef, useState } from 'react';
import { ClassificationAssignment } from '@orc/shared';
import { cloneAssignments } from '../assignment-diff';

export function useAssignmentHistory() {
  const undoStack = useRef<ClassificationAssignment[][]>([]);
  const redoStack = useRef<ClassificationAssignment[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const clearHistory = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const pushHistory = useCallback(
    (current: ClassificationAssignment[]) => {
      undoStack.current.push(cloneAssignments(current));
      if (undoStack.current.length > 80) {
        undoStack.current.shift();
      }
      redoStack.current = [];
      syncHistoryFlags();
    },
    [syncHistoryFlags],
  );

  const undo = useCallback(
    (
      assignments: ClassificationAssignment[],
      apply: (next: ClassificationAssignment[]) => void,
    ) => {
      const prev = undoStack.current.pop();
      if (!prev) {
        return false;
      }
      redoStack.current.push(cloneAssignments(assignments));
      apply(prev);
      syncHistoryFlags();
      return true;
    },
    [syncHistoryFlags],
  );

  const redo = useCallback(
    (
      assignments: ClassificationAssignment[],
      apply: (next: ClassificationAssignment[]) => void,
    ) => {
      const next = redoStack.current.pop();
      if (!next) {
        return false;
      }
      undoStack.current.push(cloneAssignments(assignments));
      apply(next);
      syncHistoryFlags();
      return true;
    },
    [syncHistoryFlags],
  );

  return { canUndo, canRedo, pushHistory, undo, redo, clearHistory };
}
