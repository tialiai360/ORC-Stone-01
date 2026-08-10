'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KNOWLEDGE_NODES } from '@orc/shared';
import type { SessionEvent } from '../review';
import { DilPanel } from '../dil/dil-panel';
import { documentFileUrl } from './api';
import { DocumentCapabilityPanel } from './components/document-capability-panel';
import { DocumentObjectPanel } from './components/document-object-panel';
import { DocumentStructurePanel } from './components/document-structure-panel';
import { WorkBriefPanel } from './components/work-brief-panel';
import { suggestKnowledgeFields, suggestTablesAsBieuMau } from './knowledge/suggest-knowledge-fields';
import type { FieldSuggestion } from './knowledge/suggest-knowledge-fields';
import {
  collectPeeledChrome,
  peeledToFieldSuggestions,
} from './knowledge/peel-chrome';
import {
  deriveLayoutLayers,
  hintsFromKeptLayers,
  loadLayerDispositions,
  modulesHiddenByDispositions,
  saveLayerDispositions,
  seedLayerDispositions,
  type LayerDisposition,
} from './knowledge/layout-layers';
import {
  CONTENT_ONLY_HIDE,
  useStructurePresentation,
  type ModulePresentationMap,
} from './hooks/use-structure-presentation';
import {
  buildRecognitionMap,
  buildRecognitionSummary,
  RecognitionExperienceBar,
  RecognitionMapPanel,
  useRecognitionCorrections,
  type RecognitionMapCell,
} from './recognition';
import type { RegionCapability } from './pdf/region-engine/types';
import type { StructureModuleId } from './pdf/plugins/types';
import { FloatingHint } from './floating-hint';
import { KnowledgeWorkspace } from './knowledge/knowledge-workspace';
import {
  PdfViewer,
  type HighlightMark,
  type PageStructureSnapshot,
  type PdfSelectionBridge,
} from './pdf-viewer';
import { PenToolbar } from './pen-toolbar';
import { buildLegalOutline } from './dpk/legal-structure';
import { aggregateDetectedModules } from './pdf/pipeline';
import type { PageDiagnostics } from './pdf/types';
import { SimilarSuggestion } from './similar-suggestion';
import { ShortcutHelper } from './shortcut-helper';
import { WorkspaceEvidenceFooter } from './components/workspace-evidence-footer';
import { WorkspaceHeader } from './components/workspace-header';
import { WorkspaceStatusBar } from './components/workspace-status-bar';
import { useAssignFlow } from './hooks/use-assign-flow';
import { useProgressiveGuide } from './hooks/use-progressive-guide';
import { useReviewExport } from './hooks/use-review-export';
import { useWorkspaceSession } from './hooks/use-workspace-session';import {
  defaultSelectedNodeId,
  useWorkspaceShortcuts,
} from './hooks/use-workspace-shortcuts';
import type { PdfBookmarkEntry } from './pdf/pdf-bookmarks';
import { DocumentOutline } from './workbench/document-outline';
import { FocusChromeBar } from './workbench/focus-chrome-bar';
import { useNavHistory } from './workbench/use-nav-history';
import { useWorkbenchAudience } from './workbench/use-workbench-audience';
import { useWorkbenchLayout } from './workbench/use-workbench-layout';
import { userGuideHint, type WorkbenchAudience } from './workbench/audience';
import { WorkbenchModeBar } from './workbench/workbench-mode-bar';
import { WorkbenchShell } from './workbench/workbench-shell';
import type { WorkspaceViewMode } from './pdf/plugins/types';

type WorkspaceProps = {
  documentId: string;
};

export function WorkspacePage({ documentId }: WorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectionBridgeRef = useRef<PdfSelectionBridge | null>(null);
  const sessionStartedAt = useRef(new Date().toISOString());
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(defaultSelectedNodeId);
  const [flashNodeId, setFlashNodeId] = useState<string | null>(null);
  const [focusedAssignmentId, setFocusedAssignmentId] = useState<string | null>(null);
  const [activePenId, setActivePenId] = useState<string | null>(null);
  const [requestPage, setRequestPage] = useState<number | null>(null);
  const [viewerPage, setViewerPage] = useState(1);
  const [viewerZoom, setViewerZoom] = useState(1.1);
  const [numPages, setNumPages] = useState(0);
  const [pageSnapshots, setPageSnapshots] = useState<Record<number, PageStructureSnapshot>>(
    {},
  );
  const [diagnostics, setDiagnostics] = useState<PageDiagnostics | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [focusedObjectId, setFocusedObjectId] = useState<string | null>(null);
  const [hiddenObjectClasses, setHiddenObjectClasses] = useState<Set<string>>(
    () => new Set(),
  );
  const [objectDebugBoxes, setObjectDebugBoxes] = useState(false);
  const [pdfBookmarks, setPdfBookmarks] = useState<PdfBookmarkEntry[]>([]);
  const [objectScopeAllPages, setObjectScopeAllPages] = useState(false);
  const [recognitionMapOpen, setRecognitionMapOpen] = useState(false);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [layerDispositions, setLayerDispositions] = useState<Record<string, LayerDisposition>>(
    () => loadLayerDispositions(documentId),
  );
  const [focusedLayerId, setFocusedLayerId] = useState<string | null>(null);
  const [suggestTick, setSuggestTick] = useState(0);
  const [evidenceTextStatus, setEvidenceTextStatus] = useState<'unknown' | 'ready' | 'empty'>(
    'unknown',
  );
  const structureFpRef = useRef<Record<number, string>>({});

  // Drop structure from previous document (capability / outline leak).
  useEffect(() => {
    structureFpRef.current = {};
    setPageSnapshots({});
    setDiagnostics(null);
    setNumPages(0);
    setViewerPage(1);
    setRequestPage(null);
    setFocusedAssignmentId(null);
    setFocusedObjectId(null);
    setHiddenObjectClasses(new Set());
    setObjectDebugBoxes(false);
    setPdfBookmarks([]);
    setObjectScopeAllPages(false);
    setRecognitionMapOpen(false);
    setDismissedSuggestionIds(new Set());
    setSuggestTick(0);
    setEvidenceTextStatus('unknown');
    setLayerDispositions(loadLayerDispositions(documentId));
    setFocusedLayerId(null);
  }, [documentId]);

  const workbench = useWorkbenchLayout();
  const audienceApi = useWorkbenchAudience();
  const isDev = audienceApi.isDeveloper;
  const nav = useNavHistory();

  const detectedModules = useMemo(
    () =>
      aggregateDetectedModules(
        Object.values(pageSnapshots).map((s) => ({
          pageNumber: s.pageNumber,
          regions: s.regions,
          flags: s.flags,
          headerText: s.headerText,
          footerText: s.footerText,
        })),
      ),
    [pageSnapshots],
  );

  const legalOutline = useMemo(
    () =>
      buildLegalOutline(
        Object.values(pageSnapshots).map((s) => ({
          pageNumber: s.pageNumber,
          regions: s.regions,
        })),
      ),
    [pageSnapshots],
  );

  const documentCapabilities = useMemo(() => {
    const map = new Map<string, RegionCapability>();
    for (const snap of Object.values(pageSnapshots)) {
      for (const cap of snap.capabilities ?? []) {
        const prev = map.get(cap.id);
        if (!prev) {
          map.set(cap.id, { ...cap });
          continue;
        }
        map.set(cap.id, {
          ...prev,
          present: prev.present || cap.present,
          doiConfirmed: Boolean(prev.doiConfirmed || cap.doiConfirmed),
          objectCount: Math.max(prev.objectCount ?? 0, cap.objectCount ?? 0) || prev.objectCount,
        });
      }
    }
    return [...map.values()];
  }, [pageSnapshots]);

  const pageObjects = pageSnapshots[viewerPage]?.objects ?? [];

  const allObjects = useMemo(
    () => Object.values(pageSnapshots).flatMap((s) => s.objects ?? []),
    [pageSnapshots],
  );

  const recognition = useRecognitionCorrections(documentId);

  const displayObjects = useMemo(
    () => recognition.applyTo(objectScopeAllPages ? allObjects : pageObjects),
    [recognition, objectScopeAllPages, allObjects, pageObjects],
  );

  const displayPageObjects = useMemo(
    () => recognition.applyTo(pageObjects).filter((o) => !o.rejected),
    [recognition, pageObjects],
  );

  const recognitionMapCells = useMemo(
    () => buildRecognitionMap(pageSnapshots[viewerPage], recognition.applyTo(pageObjects)),
    [pageSnapshots, viewerPage, recognition, pageObjects],
  );

  const recognitionSummary = useMemo(
    () =>
      buildRecognitionSummary({
        pagesAnalyzed: Object.keys(pageSnapshots).length,
        objects: recognition.applyTo(allObjects),
        modules: detectedModules,
        capabilities: documentCapabilities,
        correctionCount: recognition.correctionCount,
      }),
    [
      pageSnapshots,
      recognition,
      allObjects,
      detectedModules,
      documentCapabilities,
    ],
  );

  const structure = useStructurePresentation(detectedModules);

  // Mỗi lần mở văn bản: bóc lớp chrome, chỉ giữ nội dung.
  useEffect(() => {
    structure.resetToContentOnly();
  }, [documentId, structure.resetToContentOnly]);

  const selectedNavLayerId = useMemo(() => {
    if (structure.isolatedId) {
      return structure.isolatedId;
    }
    const hit = detectedModules.find((m) => structure.presentation[m.moduleId]?.highlight);
    return hit?.moduleId ?? null;
  }, [detectedModules, structure.isolatedId, structure.presentation]);

  const onModeChange = useCallback(
    (mode: WorkspaceViewMode) => {
      structure.setViewMode(mode);
      if (mode === 'focus') {
        workbench.applyFocusChrome(true);
      } else if (structure.mode === 'focus') {
        workbench.exitFocusRestore();
      }
    },
    [structure.mode, structure.setViewMode, workbench.applyFocusChrome, workbench.exitFocusRestore],
  );

  const onAudienceChange = useCallback(
    (next: WorkbenchAudience) => {
      audienceApi.setAudience(next);
      if (next === 'user') {
        structure.resetToContentOnly();
        setRecognitionMapOpen(false);
        setDiagOpen(false);
        setObjectDebugBoxes(false);
        setFocusedObjectId(null);
        if (structure.mode === 'focus') {
          workbench.exitFocusRestore();
        }
      }
    },
    [
      audienceApi.setAudience,
      structure.resetToContentOnly,
      structure.mode,
      workbench.exitFocusRestore,
    ],
  );

  const toggleFocus = useCallback(() => {
    onModeChange(structure.mode === 'focus' ? 'normal' : 'focus');
  }, [onModeChange, structure.mode]);

  const onStructureAnalyzed = useCallback((snapshot: PageStructureSnapshot) => {
    // Skip identical publishes — prevents parent→paint→TextLayer→analyze loop.
    const fp = [
      snapshot.pageNumber,
      snapshot.regions.length,
      snapshot.diagnostics?.textItems ?? 0,
      snapshot.diagnostics?.selectableCoverage ?? 0,
      snapshot.diagnostics?.readingOrderConfidence ?? '',
      snapshot.diagnostics?.objectRecognized ?? 0,
      snapshot.objects?.length ?? 0,
      snapshot.capabilities?.filter((c) => c.present).map((c) => c.id).join(',') ?? '',
      snapshot.headerText?.slice(0, 40) ?? '',
      snapshot.footerText?.slice(0, 40) ?? '',
    ].join('|');
    if (structureFpRef.current[snapshot.pageNumber] === fp) {
      return;
    }
    structureFpRef.current[snapshot.pageNumber] = fp;
    setPageSnapshots((prev) => ({ ...prev, [snapshot.pageNumber]: snapshot }));
    if (snapshot.diagnostics) {
      setDiagnostics(snapshot.diagnostics);
    }
  }, []);

  const pushEvent = useCallback((type: SessionEvent['type'], detail?: string) => {
    setSessionEvents((prev) => [
      ...prev,
      { type, timestamp: new Date().toISOString(), detail },
    ]);
  }, []);

  const flashNode = useCallback((nodeId: string) => {
    setFlashNodeId(nodeId);
    window.setTimeout(() => setFlashNodeId(null), 900);
  }, []);

  const guide = useProgressiveGuide();
  const session = useWorkspaceSession({ documentId, onEvent: pushEvent });

  const review = useReviewExport({
    rootRef,
    doc: session.doc,
    assignments: session.assignments,
    evidence: session.evidence,
    dilResult: session.dilResult,
    dirty: session.dirty,
    version: session.version,
    renderTimeMs: session.renderTimeMs,
    sessionEvents,
    setError: session.setError,
    setStatus: session.setStatus,
    viewerPage,
    viewerZoom,
    selectedNodeId,
    sessionStartedAt: sessionStartedAt.current,
  });

  const assign = useAssignFlow({
    assignments: session.assignments,
    setAssignments: session.setAssignments,
    pushHistory: session.pushHistory,
    setDirty: session.setDirty,
    setStatus: session.setStatus,
    setSelectedNodeId,
    setFocusedAssignmentId,
    flashNode,
    bumpAssignCount: guide.bumpAssignCount,
    onEvent: pushEvent,
  });

  const fieldSuggestions = useMemo(() => {
    void suggestTick;
    const peeled = collectPeeledChrome(Object.values(pageSnapshots));
    const fromPeel = peeledToFieldSuggestions(peeled, session.assignments);
    const fromRules = suggestKnowledgeFields(assign.pageTexts, session.assignments);
    const fromTables = suggestTablesAsBieuMau(
      Object.values(pageSnapshots).map((s) => ({
        pageNumber: s.pageNumber,
        regions: s.regions,
      })),
      session.assignments,
    );
    const layers = deriveLayoutLayers(Object.values(pageSnapshots));
    const fromLayers: FieldSuggestion[] = hintsFromKeptLayers(layers, layerDispositions).map(
      (h) => ({
        id: `sug-layer-${h.layerId}-${h.nodeId}-${h.text.slice(0, 24)}`,
        nodeId: h.nodeId,
        text: h.text,
        pageNumber: h.pageNumber,
        confidence: h.confidence,
        reason: h.reason,
      }),
    );
    // Một luồng gợi ý: ưu tiên lớp đã «Dùng để đọc», rồi peel/rules/tables (dedupe theo node+text).
    const merged = [...fromLayers, ...fromPeel, ...fromRules, ...fromTables];
    const seen = new Set<string>();
    const deduped: FieldSuggestion[] = [];
    for (const s of merged) {
      const key = `${s.nodeId}|${s.text}`;
      if (seen.has(key) || dismissedSuggestionIds.has(s.id)) {
        continue;
      }
      seen.add(key);
      deduped.push(s);
    }
    return deduped;
  }, [
    assign.pageTexts,
    session.assignments,
    dismissedSuggestionIds,
    suggestTick,
    pageSnapshots,
    layerDispositions,
  ]);

  const peeledChrome = useMemo(
    () => collectPeeledChrome(Object.values(pageSnapshots)),
    [pageSnapshots],
  );

  const layoutLayers = useMemo(
    () => deriveLayoutLayers(Object.values(pageSnapshots)),
    [pageSnapshots],
  );

  // Seed defaults (auto discard chrome) + persist session theo documentId.
  useEffect(() => {
    if (layoutLayers.length === 0) return;
    setLayerDispositions((prev) => {
      const seeded = seedLayerDispositions(layoutLayers, prev);
      if (seeded !== prev) {
        saveLayerDispositions(documentId, seeded);
        return seeded;
      }
      return prev;
    });
  }, [layoutLayers, documentId]);

  useEffect(() => {
    if (Object.keys(layerDispositions).length === 0) return;
    saveLayerDispositions(documentId, layerDispositions);
  }, [layerDispositions, documentId]);

  /** User «Chỉ nội dung»: peel chrome. «Hiện đủ lớp» shows full page again.
   * Layout Layer «Bỏ khỏi đọc» also hides matching modules (Evidence untouched). */
  const contentOnlyVisual =
    structure.mode === 'reading' || structure.mode === 'focus';
  const viewerPresentation = useMemo(() => {
    const next: Partial<ModulePresentationMap> = { ...structure.presentation };
    if (!isDev && contentOnlyVisual) {
      for (const id of CONTENT_ONLY_HIDE) {
        next[id] = { visible: false, highlight: false, focus: false };
      }
    }
    const layerHidden = modulesHiddenByDispositions(layoutLayers, layerDispositions);
    for (const id of layerHidden) {
      next[id] = { visible: false, highlight: false, focus: false };
    }
    if (focusedLayerId) {
      const layer = layoutLayers.find((l) => l.id === focusedLayerId);
      for (const mid of layer?.moduleIds ?? []) {
        const cur = next[mid];
        next[mid] = {
          visible: cur?.visible ?? true,
          highlight: true,
          focus: false,
        };
      }
    }
    return next;
  }, [
    isDev,
    contentOnlyVisual,
    structure.presentation,
    layoutLayers,
    layerDispositions,
    focusedLayerId,
  ]);
  const acceptFieldSuggestion = useCallback(
    (s: FieldSuggestion) => {
      assign.assignSelection(s.nodeId, s.text, s.pageNumber, {
        skipSuggest: true,
        source: 'auto',
      });
      setDismissedSuggestionIds((prev) => new Set(prev).add(s.id));
      session.setStatus(`Đã nhận «${KNOWLEDGE_NODES.find((n) => n.id === s.nodeId)?.label}» — nhớ Lưu`);
    },
    [assign, session],
  );
  const goPage = useCallback((page: number) => {
    setRequestPage(page);
    setViewerPage(page);
  }, []);

  useWorkspaceShortcuts({
    viewerPage,
    numPages,
    assignSelection: assign.assignSelection,
    save: session.save,
    undo: session.undo,
    redo: session.redo,
    setActivePenId,
    setSelectedNodeId,
    setStatus: session.setStatus,
    closeHint: assign.closeHint,
    toggleForceGuide: guide.toggleForceGuide,
    selectionBridgeRef,
    onToggleLeft: workbench.toggleLeft,
    onToggleRight: workbench.toggleRight,
    onToggleEvidence: workbench.toggleEvidence,
    onToggleFocus: toggleFocus,
    onGoPage: goPage,
    currentPage: viewerPage,
  });

  const onSelectTreeNode = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      flashNode(nodeId);
      const node = KNOWLEDGE_NODES.find((n) => n.id === nodeId);
      nav.push({
        kind: 'knowledge',
        label: node?.label ?? nodeId,
        nodeId,
      });
      const first = session.assignments.find((a) => a.nodeId === nodeId);
      if (first) {
        setRequestPage(first.pageNumber);
        setFocusedAssignmentId(first.id);
      }
    },
    [flashNode, nav, session.assignments],
  );

  const highlights: HighlightMark[] = useMemo(() => {
    return session.assignments.map((a) => {
      const node = KNOWLEDGE_NODES.find((n) => n.id === a.nodeId);
      return {
        id: a.id,
        text: a.text,
        color: node?.color ?? '#1A202C',
        pageNumber: a.pageNumber,
        nodeId: a.nodeId,
        flash: flashNodeId === a.nodeId,
      };
    });
  }, [flashNodeId, session.assignments]);

  const activePen = KNOWLEDGE_NODES.find((n) => n.id === activePenId) ?? null;
  const focusMode = structure.mode === 'focus';

  if (!session.doc) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)] text-sm text-[var(--muted)]">
        {session.error ?? session.status}
      </div>
    );
  }

  const isPdf = session.doc.extension === 'pdf';

  const workBriefEl = (
    <WorkBriefPanel
      documentTitle={session.doc.originalFilename}
      assignments={session.assignments}
      activeNodeId={activePenId ?? selectedNodeId}
      suggestions={fieldSuggestions}
      peeledChrome={peeledChrome}
      contentOnly={contentOnlyVisual}
      textStatus={evidenceTextStatus}
      evidenceOpen={isDev || workbench.layout.rightOpen}
      onArmNode={(nodeId) => {
        setSelectedNodeId(nodeId);
        setActivePenId(nodeId);
        session.setStatus(
          `Đang ghi «${KNOWLEDGE_NODES.find((n) => n.id === nodeId)?.label ?? nodeId}» — bôi chữ trên bằng chứng`,
        );
      }}
      onOpenAssignment={(item) => {
        setSelectedNodeId(item.nodeId);
        setFocusedAssignmentId(item.id);
        setRequestPage(item.pageNumber);
        flashNode(item.nodeId);
        if (!isDev && !workbench.layout.rightOpen) {
          workbench.toggleRight();
        }
        nav.push({
          kind: 'knowledge',
          label: `${KNOWLEDGE_NODES.find((n) => n.id === item.nodeId)?.label ?? ''} · p.${item.pageNumber}`,
          pageNumber: item.pageNumber,
          nodeId: item.nodeId,
        });
      }}
      onUpdateAssignmentText={(id, text) => {
        if (!text) {
          return;
        }
        session.pushHistory(session.assignments);
        session.setAssignments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, text } : a)),
        );
        session.setDirty(true);
        session.setStatus('Đã sửa kiến thức — nhớ Lưu');
      }}
      onAcceptSuggestion={acceptFieldSuggestion}
      onDismissSuggestion={(id) => {
        setDismissedSuggestionIds((prev) => new Set(prev).add(id));
      }}
      onAcceptAllHigh={() => {
        const highs = fieldSuggestions.filter((s) => s.confidence === 'HIGH');
        if (highs.length === 0) {
          return;
        }
        session.pushHistory(session.assignments);
        const now = new Date().toISOString();
        const added = highs.map((s) => ({
          id: crypto.randomUUID(),
          nodeId: s.nodeId,
          text: s.text,
          pageNumber: s.pageNumber,
          createdAt: now,
          source: 'auto' as const,
        }));
        session.setAssignments([...session.assignments, ...added]);
        setDismissedSuggestionIds((prev) => {
          const next = new Set(prev);
          for (const s of highs) {
            next.add(s.id);
          }
          return next;
        });
        session.setDirty(true);
        session.setStatus(`Đã nhận ${highs.length} gợi ý cao — nhớ Lưu`);
      }}
      onRefreshSuggestions={() => {
        setDismissedSuggestionIds(new Set());
        setSuggestTick((n) => n + 1);
        session.setStatus('Đã quét lại gợi ý từ chữ đã đọc');
      }}
      onLocateEvidence={(page) => {
        goPage(page);
        if (!isDev && !workbench.layout.rightOpen) {
          workbench.toggleRight();
        }
      }}
      onOpenEvidence={() => {
        if (!workbench.layout.rightOpen) {
          workbench.toggleRight();
        }
      }}
      onSave={() => void session.save()}
      dirty={session.dirty}
      saving={session.saving}
    />
  );

  const pdfEl = isPdf ? (
    <PdfViewer
      fileUrl={documentFileUrl(documentId)}
      highlights={highlights}
      activePenColor={activePen?.color ?? null}
      flashNodeId={flashNodeId}
      requestPage={requestPage}
      modulePresentation={viewerPresentation}
      contentOnlyVisual={contentOnlyVisual}
      showSelectionBlocks={structure.showSelectionBlocks}
      highlightParagraphs={structure.highlightParagraphs}
      selectionBridgeRef={selectionBridgeRef}
      diagOpen={isDev && diagOpen}
      onDiagOpenChange={setDiagOpen}
      onPageChange={(p) => {
        setViewerPage(p);
        setRequestPage(null);
      }}
      onZoomChange={setViewerZoom}
      onNumPages={setNumPages}
      onPageText={assign.onViewerPageText}
      onTextStatus={setEvidenceTextStatus}
      onStructureAnalyzed={onStructureAnalyzed}
      onDiagnostics={setDiagnostics}
      onPenStroke={({ text, pageNumber, structureRef }) => {
        if (activePenId) {
          assign.assignSelection(activePenId, text, pageNumber, { structureRef });
        }
      }}
      onTextSelected={assign.onTextSelected}
      objectInsights={isDev ? displayPageObjects : []}
      focusedObjectId={isDev ? focusedObjectId : null}
      hiddenObjectClasses={hiddenObjectClasses}
      objectDebugBoxes={isDev && objectDebugBoxes}
      showRecognitionMap={isDev && recognitionMapOpen}
      recognitionMapCells={recognitionMapCells}
      onBookmarks={setPdfBookmarks}
      onHighlightClick={(mark) => {
        setSelectedNodeId(mark.nodeId);
        setFocusedAssignmentId(mark.id);
        flashNode(mark.nodeId);
        nav.push({
          kind: 'knowledge',
          label:
            KNOWLEDGE_NODES.find((n) => n.id === mark.nodeId)?.label ?? mark.nodeId,
          pageNumber: mark.pageNumber,
          nodeId: mark.nodeId,
        });
      }}
    />
  ) : (
    <div className="flex h-full items-center justify-center p-8 text-sm text-[var(--muted)]">
      Tài liệu DOCX đã lưu. Workspace tô màu chỉ hỗ trợ PDF.
    </div>
  );

  return (
    <div ref={rootRef} className="flex h-screen flex-col bg-[var(--bg)] text-[var(--fg)]">
      {!focusMode ? (
        <WorkspaceHeader
          filename={session.doc.originalFilename}
          version={session.version}
          dirty={session.dirty}
          canUndo={session.canUndo}
          canRedo={session.canRedo}
          saving={session.saving}
          exporting={review.exporting}
          workDesk={!isDev}
          onUndo={session.undo}
          onRedo={session.redo}
          onSave={() => void session.save()}
          onExport={() => void review.onExportReview()}
        />
      ) : (
        <FocusChromeBar
          filename={session.doc.originalFilename}
          dirty={session.dirty}
          saving={session.saving}
          onExitFocus={() => onModeChange('normal')}
          onSave={() => void session.save()}
        />
      )}

      <WorkbenchModeBar
        audience={audienceApi.audience}
        onAudienceChange={onAudienceChange}
        mode={structure.mode}
        onModeChange={onModeChange}
        leftOpen={workbench.layout.leftOpen}
        rightOpen={workbench.layout.rightOpen}
        evidenceOpen={workbench.layout.evidenceOpen}
        onToggleLeft={workbench.toggleLeft}
        onToggleRight={workbench.toggleRight}
        onToggleEvidence={workbench.toggleEvidence}
        diagnostics={diagnostics}
        diagOpen={diagOpen}
        onToggleDiag={() => setDiagOpen((v) => !v)}
      />

      <PenToolbar
        activeNodeId={activePenId}
        onSelectPen={(id) => assign.selectPen(id, setActivePenId)}
        compact={workbench.layout.pensCompact || focusMode || !isDev}
      />

      {!focusMode ? (
        <WorkspaceStatusBar
          status={session.status}
          error={session.error}
          guideHint={
            isDev
              ? undefined
              : userGuideHint(contentOnlyVisual)
          }
        />
      ) : null}
      {!focusMode && isDev ? (
        <RecognitionExperienceBar
          summary={recognitionSummary}
          mapOpen={recognitionMapOpen}
          contentOnly={structure.mode === 'reading' || structure.mode === 'focus'}
          onToggleMap={() => setRecognitionMapOpen((v) => !v)}
          onClearCorrections={
            recognition.correctionCount > 0 ? recognition.clearAll : undefined
          }
        />
      ) : null}

      <WorkbenchShell
        leftOpen={workbench.layout.leftOpen}
        rightOpen={workbench.layout.rightOpen}
        leftWidth={workbench.layout.leftWidth}
        rightWidth={workbench.layout.rightWidth}
        onLeftWidth={workbench.setLeftWidth}
        onRightWidth={workbench.setRightWidth}
        left={
          <DocumentOutline
            numPages={numPages}
            currentPage={viewerPage}
            outline={legalOutline}
            layers={detectedModules}
            selectedLayerId={selectedNavLayerId}
            bookmarks={pdfBookmarks}
            recent={nav.recent}
            simpleNav={!isDev}
            onGoPage={(p) => {
              structure.clearHighlights();
              goPage(p);
              nav.push({ kind: 'page', label: `Trang ${p}`, pageNumber: p });
            }}
            onGoOutline={(e) => {
              structure.clearHighlights();
              goPage(e.pageNumber);
              nav.push({
                kind: 'outline',
                label: e.text.slice(0, 40),
                pageNumber: e.pageNumber,
              });
            }}
            onGoBookmark={(b) => {
              structure.clearHighlights();
              goPage(b.pageNumber);
              nav.push({
                kind: 'outline',
                label: b.title.slice(0, 40),
                pageNumber: b.pageNumber,
              });
            }}
            onGoLayer={(m) => {
              const page = m.pageNumbers.includes(viewerPage)
                ? viewerPage
                : (m.pageNumbers[0] ?? 1);
              // Left nav = locate only (page jump + highlight), never isolate / visibility
              structure.locateModule(m.moduleId);
              goPage(page);
              nav.push({
                kind: 'outline',
                label: m.labelVi,
                pageNumber: page,
              });
            }}
            onGoRecent={(loc) => {
              structure.clearHighlights();
              if (loc.pageNumber) {
                goPage(loc.pageNumber);
              }
              if (loc.nodeId) {
                setSelectedNodeId(loc.nodeId);
              }
            }}
          />
        }
        center={isDev ? pdfEl : workBriefEl}
        right={
          isDev ? (
          <>
            <DocumentCapabilityPanel
              capabilities={documentCapabilities}
              visibleByModule={Object.fromEntries(
                detectedModules.map((m) => [
                  m.moduleId,
                  structure.presentation[m.moduleId]?.visible !== false,
                ]),
              )}
              onToggleVisible={(moduleId) =>
                structure.toggleVisible(moduleId as StructureModuleId)
              }
              onLocate={(moduleId) => {
                const m = detectedModules.find((d) => d.moduleId === moduleId);
                const page =
                  m?.pageNumbers.includes(viewerPage)
                    ? viewerPage
                    : (m?.pageNumbers[0] ?? viewerPage);
                structure.locateModule(moduleId as StructureModuleId);
                if (page) {
                  goPage(page);
                  nav.push({
                    kind: 'outline',
                    label: m?.labelVi ?? moduleId,
                    pageNumber: page,
                  });
                }
              }}
            />
            <DocumentObjectPanel
              objects={displayObjects}
              focusedObjectId={focusedObjectId}
              hiddenClasses={hiddenObjectClasses}
              debugBoxes={objectDebugBoxes}
              scopeAllPages={objectScopeAllPages}
              onScopeAllPagesChange={setObjectScopeAllPages}
              onFocusObject={(id, pageNumber) => {
                setFocusedObjectId(id);
                if (id && pageNumber && pageNumber !== viewerPage) {
                  goPage(pageNumber);
                }
              }}
              onToggleClass={(cls) => {
                setHiddenObjectClasses((prev) => {
                  const next = new Set(prev);
                  if (next.has(cls)) {
                    next.delete(cls);
                  } else {
                    next.add(cls);
                  }
                  return next;
                });
              }}
              onToggleDebug={() => setObjectDebugBoxes((v) => !v)}
              onConfirmObject={recognition.confirmObject}
              onRejectObject={recognition.rejectObject}
              onReclassObject={recognition.reclassObject}
              onClearObjectCorrection={recognition.clearObjectCorrection}
            />
            {recognitionMapOpen ? (
              <RecognitionMapPanel
                cells={recognitionMapCells}
                pageNumber={viewerPage}
                focusedId={focusedObjectId}
                onSelectCell={(cell: RecognitionMapCell) => {
                  if (cell.pageNumber !== viewerPage) {
                    goPage(cell.pageNumber);
                  }
                  if (cell.source === 'object') {
                    const oid = cell.id.replace(/^object:/, '');
                    setFocusedObjectId(oid);
                    setObjectDebugBoxes(true);
                  } else if (cell.moduleId) {
                    structure.locateModule(cell.moduleId as StructureModuleId);
                  }
                }}
              />
            ) : null}
            <DocumentStructurePanel
              detected={detectedModules}
              presentation={structure.presentation}
              mode={structure.mode}
              isolatedId={structure.isolatedId}
              onModeChange={onModeChange}
              onToggleVisible={structure.toggleVisible}
              onToggleHighlight={structure.toggleHighlight}
              onLocate={(id, page) => {
                structure.locateModule(id);
                goPage(page);
                nav.push({
                  kind: 'outline',
                  label:
                    detectedModules.find((d) => d.moduleId === id)?.labelVi ?? id,
                  pageNumber: page,
                });
              }}
              onIsolate={structure.isolateModule}
              onClearIsolate={structure.clearIsolate}
              hideModes
            />
            <div className="min-h-0 flex-1">
              <KnowledgeWorkspace
                assignments={session.assignments}
                selectedNodeId={selectedNodeId}
                onSelectNode={onSelectTreeNode}
                flashNodeId={flashNodeId}
                focusedAssignmentId={focusedAssignmentId}
                onSelectAssignment={(item) => {
                  setSelectedNodeId(item.nodeId);
                  setFocusedAssignmentId(item.id);
                  setRequestPage(item.pageNumber);
                  flashNode(item.nodeId);
                  nav.push({
                    kind: 'knowledge',
                    label: `${KNOWLEDGE_NODES.find((n) => n.id === item.nodeId)?.label ?? ''} · p.${item.pageNumber}`,
                    pageNumber: item.pageNumber,
                    nodeId: item.nodeId,
                  });
                }}
                evidenceCount={session.evidence.length}
                dirty={session.dirty}
                reviewHint={review.reviewExported ? 'Đã xuất gói' : 'Chưa xuất gói'}
              />
            </div>
          </>
          ) : (
            <div className="flex h-full min-h-0 flex-col bg-[var(--bg)]">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] px-2 py-1">
                <span className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                  Bằng chứng (PDF)
                </span>
                <button
                  type="button"
                  className="orc-btn !px-1.5 !py-0 !text-[10px]"
                  onClick={workbench.toggleRight}
                  title="Ẩn bằng chứng"
                >
                  Ẩn
                </button>
              </div>
              <div className="min-h-0 flex-1">{pdfEl}</div>
            </div>
          )
        }
      />

      {/* Keep PDF mounted off-screen in user mode when Evidence closed — so text/suggestions still load. */}
      {!isDev && !workbench.layout.rightOpen && isPdf ? (
        <div
          className="pointer-events-none fixed -left-[120vw] top-0 h-[80vh] w-[60vw] opacity-0"
          aria-hidden
        >
          {pdfEl}
        </div>
      ) : null}

      {isDev && workbench.layout.evidenceOpen && !focusMode ? (
        <WorkspaceEvidenceFooter evidence={session.evidence} />
      ) : null}

      {isDev ? (
        <DilPanel
          documentId={documentId}
          result={session.dilResult}
          loading={session.dilLoading}
          onUpdated={session.setDilResult}
        />
      ) : null}

      <FloatingHint
        open={assign.hint.open}
        x={assign.hint.x}
        y={assign.hint.y}
        selectedText={assign.hint.text}
        onClose={assign.closeHint}
        onAssign={(nodeId) =>
          assign.assignSelection(nodeId, assign.hint.text, assign.hint.pageNumber, {
            structureRef: assign.hint.structureRef,
          })
        }
      />

      <SimilarSuggestion
        open={assign.suggestion.open}
        count={assign.suggestion.fragments.length}
        sample={assign.suggestion.sample}
        onNo={assign.dismissSimilar}
        onYes={assign.applySimilarYes}
      />

      {isDev ? (
        <ShortcutHelper
          mode={guide.helperMode}
          forceShow={guide.forceGuide}
          onDismissForce={() => guide.setForceGuide(false)}
          usedOnce={guide.assignCount > 0}
        />
      ) : null}    </div>
  );
}
