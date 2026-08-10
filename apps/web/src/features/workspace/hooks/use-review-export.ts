'use client';

import { useCallback, useState, type RefObject } from 'react';
import type {
  ClassificationAssignment,
  DilDocumentResult,
  DocumentMetadata,
  StructureCorrectedEvidence,
} from '@orc/shared';
import { exportReviewPackage, type SessionEvent } from '../../review';

type Args = {
  rootRef: RefObject<HTMLDivElement | null>;
  doc: DocumentMetadata | null;
  assignments: ClassificationAssignment[];
  evidence: Array<StructureCorrectedEvidence & { id?: string }>;
  dilResult: DilDocumentResult | null;
  dirty: boolean;
  version: number;
  renderTimeMs: number | null;
  sessionEvents: SessionEvent[];
  setError: (e: string | null) => void;
  setStatus: (s: string) => void;
  viewerPage: number;
  viewerZoom: number;
  selectedNodeId: string | null;
  sessionStartedAt: string;
};

/** Review package export — keeps workspace-page orchestration thinner. */
export function useReviewExport({
  rootRef,
  doc,
  assignments,
  evidence,
  dilResult,
  dirty,
  version,
  renderTimeMs,
  sessionEvents,
  setError,
  setStatus,
  viewerPage,
  viewerZoom,
  selectedNodeId,
  sessionStartedAt,
}: Args) {
  const [exporting, setExporting] = useState(false);
  const [reviewExported, setReviewExported] = useState(false);

  const onExportReview = useCallback(async () => {
    if (!doc) {
      return;
    }
    try {
      setExporting(true);
      setError(null);
      await exportReviewPackage({
        document: doc,
        assignments,
        evidence,
        sessionEvents,
        sessionStartedAt,
        renderTimeMs,
        rootElement: rootRef.current,
        dil: dilResult,
        snapshot: {
          documentId: doc.id,
          documentFilename: doc.originalFilename,
          pageNumber: viewerPage,
          zoom: viewerZoom,
          selectedNodeId,
          sidebarExpandedNodeId: selectedNodeId,
          assignmentCount: assignments.length,
          dirty,
          sessionVersion: version,
          capturedAt: new Date().toISOString(),
        },
      });
      setReviewExported(true);
      setStatus('Đã tạo gói Review.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xuất Review thất bại');
      setStatus('Lỗi xuất Review');
    } finally {
      setExporting(false);
    }
  }, [
    assignments,
    dilResult,
    dirty,
    doc,
    evidence,
    renderTimeMs,
    rootRef,
    selectedNodeId,
    sessionEvents,
    sessionStartedAt,
    setError,
    setStatus,
    version,
    viewerPage,
    viewerZoom,
  ]);

  return {
    exporting,
    reviewExported,
    onExportReview,
  };
}
