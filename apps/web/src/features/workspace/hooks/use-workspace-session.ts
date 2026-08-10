'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClassificationAssignment,
  DilDocumentResult,
  DocumentMetadata,
  StructureCorrectedEvidence,
} from '@orc/shared';
import type { SessionEvent } from '../../review';
import { getDilResult } from '../../dil/api';
import {
  getClassificationSession,
  getDocument,
  listStructureEvidence,
  reviewerId,
  saveClassificationSession,
} from '../api';
import { cloneAssignments, diffCorrections } from '../assignment-diff';
import { useAssignmentHistory } from './use-assignment-history';

type UseWorkspaceSessionArgs = {
  documentId: string;
  onEvent: (type: SessionEvent['type'], detail?: string) => void;
};

export function useWorkspaceSession({ documentId, onEvent }: UseWorkspaceSessionArgs) {
  const mountedAt = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const [renderTimeMs, setRenderTimeMs] = useState<number | null>(null);
  const [doc, setDoc] = useState<DocumentMetadata | null>(null);
  const [assignments, setAssignments] = useState<ClassificationAssignment[]>([]);
  const [baseline, setBaseline] = useState<ClassificationAssignment[]>([]);
  const [version, setVersion] = useState(0);
  const [evidence, setEvidence] = useState<
    Array<StructureCorrectedEvidence & { id?: string }>
  >([]);
  const [status, setStatus] = useState<string>('Đang tải…');
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dilResult, setDilResult] = useState<DilDocumentResult | null>(null);
  const [dilLoading, setDilLoading] = useState(false);

  const { canUndo, canRedo, pushHistory, undo: undoHistory, redo: redoHistory, clearHistory } =
    useAssignmentHistory();
  const reviewer = useMemo(() => reviewerId(), []);

  const load = useCallback(async () => {
    try {
      setError(null);
      setStatus('Đang tải…');
      const [meta, session, ev] = await Promise.all([
        getDocument(documentId),
        getClassificationSession(documentId),
        listStructureEvidence(documentId),
      ]);
      setDoc(meta);
      setAssignments(session.assignments);
      setBaseline(cloneAssignments(session.assignments));
      setVersion(session.version);
      setEvidence(ev);
      setDirty(false);
      clearHistory();
      onEventRef.current('import', meta.originalFilename);
      const autoCount = session.assignments.filter((a) => a.source !== 'manual').length;
      setStatus(
        meta.extension === 'pdf'
          ? autoCount > 0
            ? `Sẵn sàng · ORC đã tô ${autoCount} đoạn`
            : 'Sẵn sàng'
          : 'Chỉ hỗ trợ xem PDF',
      );
      if (mountedAt.current) {
        setRenderTimeMs(Math.round(performance.now() - mountedAt.current));
      }
      setDilLoading(true);
      void getDilResult(documentId)
        .then((dil) => setDilResult(dil))
        .catch(() => setDilResult(null))
        .finally(() => setDilLoading(false));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải workspace');
      setStatus('Lỗi');
    }
  }, [clearHistory, documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      const corrections = diffCorrections(baseline, assignments);
      const result = await saveClassificationSession(documentId, {
        assignments,
        reviewer,
        corrections,
      });
      setAssignments(result.session.assignments);
      setBaseline(cloneAssignments(result.session.assignments));
      setVersion(result.session.version);
      setDirty(false);
      const ev = await listStructureEvidence(documentId);
      setEvidence(ev);
      onEvent('save', `v${result.session.version}`);
      setStatus(`Đã lưu phiên v${result.session.version}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại');
      setStatus('Lỗi lưu');
    } finally {
      setSaving(false);
    }
  }, [assignments, baseline, documentId, onEvent, reviewer]);

  const undo = useCallback(() => {
    const ok = undoHistory(assignments, setAssignments);
    if (!ok) {
      return;
    }
    setDirty(true);
    setStatus('Đã hoàn tác — chưa lưu');
    onEvent('undo');
  }, [assignments, onEvent, undoHistory]);

  const redo = useCallback(() => {
    const ok = redoHistory(assignments, setAssignments);
    if (!ok) {
      return;
    }
    setDirty(true);
    setStatus('Đã làm lại — chưa lưu');
    onEvent('redo');
  }, [assignments, onEvent, redoHistory]);

  return {
    doc,
    assignments,
    setAssignments,
    version,
    evidence,
    status,
    setStatus,
    error,
    setError,
    dirty,
    setDirty,
    saving,
    dilResult,
    setDilResult,
    dilLoading,
    renderTimeMs,
    canUndo,
    canRedo,
    pushHistory,
    save,
    undo,
    redo,
  };
}
