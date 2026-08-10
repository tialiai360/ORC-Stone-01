import {
  ClassificationAssignment,
  DilDocumentResult,
  DocumentMetadata,
  StructureCorrectedEvidence,
} from '@orc/shared';

export type SessionEventType =
  | 'import'
  | 'highlight'
  | 'assign'
  | 'undo'
  | 'redo'
  | 'save';

export type SessionEvent = {
  type: SessionEventType;
  timestamp: string;
  detail?: string;
};

export type WorkspaceSnapshot = {
  documentId: string;
  documentFilename: string;
  pageNumber: number;
  zoom: number;
  selectedNodeId: string | null;
  sidebarExpandedNodeId: string | null;
  assignmentCount: number;
  dirty: boolean;
  sessionVersion: number;
  capturedAt: string;
};

export type ReviewExportInput = {
  document: DocumentMetadata;
  assignments: ClassificationAssignment[];
  evidence: Array<StructureCorrectedEvidence & { id?: string }>;
  snapshot: WorkspaceSnapshot;
  sessionEvents: SessionEvent[];
  sessionStartedAt: string;
  renderTimeMs: number | null;
  rootElement: HTMLElement | null;
  dil?: DilDocumentResult | null;
};
