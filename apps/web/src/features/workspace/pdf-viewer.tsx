'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { AssignmentStructureRef } from '@orc/shared';
import type { ModulePresentationMap } from './hooks/use-structure-presentation';
import {
  isModuleHidden,
  isModuleHighlighted,
  isItemVisibleInPresentation,
} from './hooks/use-structure-presentation';
import {
  analyzePageElement,
  footerTextFromRegions,
  headerTextFromRegions,
} from './pdf/pipeline';
import { extractPdfBookmarks, type PdfBookmarkEntry } from './pdf/pdf-bookmarks';
import { findInPageCorpora, findMatchBoxesStrict } from './pdf/pdf-find';
import { selectionTextFromModel, structureRefFromSelection } from './pdf/selection-engine';
import { StructureDiagnosticsPanel } from './pdf/structure-diagnostics-panel';
import { PdfViewerToolbar, type PdfScrollMode } from './pdf/pdf-viewer-toolbar';
import { installTextLayerAbortFilter } from './pdf/suppress-textlayer-abort';
import type { PageDiagnostics, PageStructureModel, StructureRegion } from './pdf/types';
import type {
  FocusRegionRequest,
  HighlightMark,
  ObjectInsight,
  PageStructureSnapshot,
  PdfSelectionBridge,
} from './pdf/viewer-types';

export type {
  FocusRegionRequest,
  HighlightMark,
  ObjectInsight,
  PageStructureSnapshot,
  PdfSelectionBridge,
} from './pdf/viewer-types';

function toObjectInsights(model: PageStructureModel): ObjectInsight[] {
  const g = model.objectGraph;
  if (!g) {
    return [];
  }
  const pw = g.pageWidth || 1;
  const ph = g.pageHeight || 1;
  return g.objects
    .filter((o) => o.class !== 'body-text')
    .map((o) => ({
      id: o.id,
      pageNumber: o.pageNumber,
      class: o.class,
      confidence: o.confidence,
      confidenceScore: o.confidenceScore,
      regionHint: o.regionHint,
      textPreview: (o.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
      reasons: o.reasons.slice(0, 8),
      left: (o.bbox.x / pw) * 100,
      top: (o.bbox.y / ph) * 100,
      width: (o.bbox.w / pw) * 100,
      height: (o.bbox.h / ph) * 100,
    }));
}

/** Modules painted on the PDF canvas that we visually cover when hidden (raw PDF untouched). */
const PEEL_VISUAL_MODULES = new Set([
  'watermark',
  'rotated-text',
  'signature',
  'stamp',
  'digital-signature',
  'logo',
]);

type PeelVisualMask = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
};

const PEEL_OBJECT_CLASSES = new Set([
  'watermark',
  'signature',
  'digital-signature',
  'stamp',
  'seal',
  'logo',
]);

/**
 * Cover chrome still painted on the PDF canvas after TextLayer peel.
 * Also used when content-only canvas hide is off (e.g. empty TextLayer pages).
 * Large AABB → per-item masks to avoid blanking body text.
 */
function buildPeelVisualMasks(
  model: PageStructureModel,
  presentation: Partial<ModulePresentationMap> | undefined,
): PeelVisualMask[] {
  const pres = presentation ?? {};
  const pw = model.pageWidth || 1;
  const ph = model.pageHeight || 1;
  const pad = 0.45;
  const out: PeelVisualMask[] = [];
  const seen = new Set<string>();

  const pushBox = (id: string, x: number, y: number, w: number, h: number, label: string) => {
    if (seen.has(id) || w <= 0 || h <= 0) return;
    seen.add(id);
    out.push({
      id,
      left: Math.max(0, (x / pw) * 100 - pad),
      top: Math.max(0, (y / ph) * 100 - pad),
      width: Math.min(100, (w / pw) * 100 + pad * 2),
      height: Math.min(100, (h / ph) * 100 + pad * 2),
      label,
    });
  };

  for (const r of model.regions) {
    const mid = r.moduleId;
    if (!mid || !PEEL_VISUAL_MODULES.has(mid)) continue;
    if (!isModuleHidden(pres, mid)) continue;

    const areaRatio = (r.w * r.h) / (pw * ph);
    if (areaRatio > 0.18) {
      for (const itemId of r.itemIds) {
        const it = model.items.find((i) => i.id === itemId);
        if (!it) continue;
        pushBox(`peel-item-${it.id}`, it.x, it.y, it.w, it.h, mid);
      }
    } else {
      pushBox(`peel-r-${r.id}`, r.x, r.y, r.w, r.h, mid);
    }
  }

  if (isModuleHidden(pres, 'watermark')) {
    for (const it of model.items) {
      if (!it.flags?.watermark) continue;
      pushBox(`peel-item-${it.id}`, it.x, it.y, it.w, it.h, 'watermark');
    }
  }

  const graph = model.objectGraph;
  if (graph) {
    const gpw = graph.pageWidth || pw;
    const gph = graph.pageHeight || ph;
    for (const o of graph.objects) {
      if (!PEEL_OBJECT_CLASSES.has(o.class)) continue;
      const mod =
        o.class === 'seal'
          ? 'stamp'
          : o.class === 'digital-signature'
            ? 'digital-signature'
            : o.class;
      if (!isModuleHidden(pres, mod)) continue;
      const id = `peel-obj-${o.id}`;
      if (seen.has(id) || o.bbox.w <= 0 || o.bbox.h <= 0) continue;
      seen.add(id);
      out.push({
        id,
        left: Math.max(0, (o.bbox.x / gpw) * 100 - pad),
        top: Math.max(0, (o.bbox.y / gph) * 100 - pad),
        width: Math.min(100, (o.bbox.w / gpw) * 100 + pad * 2),
        height: Math.min(100, (o.bbox.h / gph) * 100 + pad * 2),
        label: o.class,
      });
    }
  }

  return out;
}
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const SCROLL_MODE_KEY = 'orc.pdf.scrollMode.v1';

type PdfViewerProps = {
  fileUrl: string;
  highlights: HighlightMark[];
  activePenColor: string | null;
  flashNodeId: string | null;
  requestPage: number | null;
  /** Jump + zoom Evidence to a layout region (Clean Desk layer select). */
  requestFocusRegion?: FocusRegionRequest | null;
  modulePresentation?: Partial<ModulePresentationMap>;
  /**
   * Content-only presentation: hide painted PDF canvas + annotations
   * (watermark / chữ ký số vẫn nằm trên canvas; TextLayer giữ để chọn chữ).
   * Raw PDF không bị sửa.
   */
  contentOnlyVisual?: boolean;
  /**
   * Evidence / đối chiếu: show PDF canvas like Foxit.
   * TextLayer stays in DOM for extraction but is invisible (avoids black diagonal WM glyphs).
   */
  canvasOnlyVisual?: boolean;
  /**
   * How discarded / non-focused modules look on Evidence.
   * - cover: solid white peel (reading / content-only)
   * - fade: dim translucent (Clean Desk layout check — avoids huge blank blocks)
   */
  visualPeelMode?: 'cover' | 'fade';
  /**
   * When false, TextLayer spans without a structure module are peeled
   * (used when «Nội dung chính» is on the shelf).
   */
  untaggedTextVisible?: boolean;
  showSelectionBlocks?: boolean;
  highlightParagraphs?: boolean;
  selectionBridgeRef?: MutableRefObject<PdfSelectionBridge | null>;
  diagOpen?: boolean;
  onDiagOpenChange?: (open: boolean) => void;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
  onNumPages?: (n: number) => void;
  onPageText?: (page: number, text: string) => void;
  /** Usable embedded text on the active page (Work Desk honesty). */
  onTextStatus?: (status: 'unknown' | 'ready' | 'empty') => void;
  onStructureAnalyzed?: (snapshot: PageStructureSnapshot) => void;
  onDiagnostics?: (diagnostics: PageDiagnostics | null) => void;
  onPenStroke: (payload: {
    text: string;
    pageNumber: number;
    structureRef?: AssignmentStructureRef;
  }) => void;
  onTextSelected: (payload: {
    text: string;
    pageNumber: number;
    clientX: number;
    clientY: number;
    structureRef?: AssignmentStructureRef;
  }) => void;
  onHighlightClick: (mark: HighlightMark) => void;
  /** DOI object overlays (from parent snapshot). */
  objectInsights?: ObjectInsight[];
  focusedObjectId?: string | null;
  hiddenObjectClasses?: Set<string>;
  objectDebugBoxes?: boolean;
  /** EVO-009 Recognition Map overlay (page-relative %). */
  recognitionMapCells?: Array<{
    id: string;
    left: number;
    top: number;
    width: number;
    height: number;
    label?: string;
    source?: string;
  }>;
  showRecognitionMap?: boolean;
  /** Native PDF outline/bookmarks (pdf.js). */
  onBookmarks?: (entries: PdfBookmarkEntry[]) => void;
};

function isAbortError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  const name = (error as { name?: string }).name ?? '';
  const message = String((error as { message?: string }).message ?? error);
  return (
    name === 'AbortException' ||
    message.includes('AbortException') ||
    message.includes('TextLayer task cancelled') ||
    message.includes('Rendering cancelled')
  );
}

function normalizeMatch(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

function moduleForItem(model: PageStructureModel, itemId: string): string | undefined {
  const region = model.regions.find((r) => r.itemIds.includes(itemId));
  return region?.moduleId;
}

function loadScrollMode(): PdfScrollMode {
  if (typeof window === 'undefined') {
    return 'single';
  }
  try {
    return window.localStorage.getItem(SCROLL_MODE_KEY) === 'continuous'
      ? 'continuous'
      : 'single';
  } catch {
    return 'single';
  }
}

function pageWrapSelector(page: number): string {
  return `[data-orc-page-wrap="${page}"]`;
}

function getPageEl(root: HTMLElement, page: number): HTMLElement | null {
  return root.querySelector<HTMLElement>(`${pageWrapSelector(page)} .react-pdf__Page`);
}

function resolvePageFromNode(
  root: HTMLElement,
  node: Node | null,
  fallbackPage: number,
): { pageEl: HTMLElement | null; pageNumber: number } {
  const el = node instanceof Element ? node : node?.parentElement ?? null;
  const wrap = el?.closest?.('[data-orc-page-wrap]') as HTMLElement | null;
  if (wrap?.dataset.orcPageWrap) {
    const n = Number(wrap.dataset.orcPageWrap);
    if (Number.isFinite(n)) {
      return {
        pageEl: wrap.querySelector<HTMLElement>('.react-pdf__Page'),
        pageNumber: n,
      };
    }
  }
  return { pageEl: getPageEl(root, fallbackPage), pageNumber: fallbackPage };
}

export function PdfViewer({
  fileUrl,
  highlights,
  activePenColor,
  flashNodeId,
  requestPage,
  requestFocusRegion = null,
  modulePresentation = {},
  contentOnlyVisual = false,
  canvasOnlyVisual = false,
  visualPeelMode = 'cover',
  untaggedTextVisible = true,
  showSelectionBlocks = false,
  highlightParagraphs = false,
  selectionBridgeRef,
  diagOpen: diagOpenControlled,
  onDiagOpenChange,
  onPageChange,
  onZoomChange,
  onNumPages,
  onPageText,
  onTextStatus,
  onStructureAnalyzed,
  onDiagnostics,
  onPenStroke,
  onTextSelected,
  onHighlightClick,
  objectInsights = [],
  focusedObjectId = null,
  hiddenObjectClasses,
  objectDebugBoxes = false,
  recognitionMapCells = [],
  showRecognitionMap = false,
  onBookmarks,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [pageInput, setPageInput] = useState('1');
  const [scrollMode, setScrollMode] = useState<PdfScrollMode>('single');
  const [error, setError] = useState<string | null>(null);
  const [textStatus, setTextStatus] = useState<'unknown' | 'ready' | 'empty'>('unknown');
  const [diagnostics, setDiagnostics] = useState<PageDiagnostics | null>(null);
  const [diagOpenLocal, setDiagOpenLocal] = useState(false);
  const diagOpen = diagOpenControlled ?? diagOpenLocal;
  const setDiagOpen = onDiagOpenChange ?? setDiagOpenLocal;
  const [overlayRegions, setOverlayRegions] = useState<StructureRegion[]>([]);
  const [peelMasks, setPeelMasks] = useState<PeelVisualMask[]>([]);
  const [blockOverlays, setBlockOverlays] = useState<
    Array<{ id: string; x: number; y: number; w: number; h: number; role?: string }>
  >([]);
  /** Knowledge tô — % of page box so marks survive TextLayer remount on zoom. */
  const [markOverlays, setMarkOverlays] = useState<
    Array<{
      key: string;
      markId: string;
      color: string;
      flash: boolean;
      left: number;
      top: number;
      width: number;
      height: number;
    }>
  >([]);
  const [markOverlayPage, setMarkOverlayPage] = useState(1);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findIndex, setFindIndex] = useState(0);
  const [findBoxes, setFindBoxes] = useState<
    Array<{ left: number; top: number; width: number; height: number; rank: number }>
  >([]);
  const [pageCorpora, setPageCorpora] = useState<Record<number, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const pageModelRef = useRef<PageStructureModel | null>(null);
  const pageHeightCacheRef = useRef<Map<number, number>>(new Map());
  const analyzedForRef = useRef('');
  const suppressObserverRef = useRef(false);
  /** While zoom remounts Canvas/TextLayer, lock layout + scroll anchor. */
  const zoomingRef = useRef(false);
  const zoomAnchorRef = useRef<{ page: number; offset: number } | null>(null);
  const zoomUnlockTimerRef = useRef<number | undefined>(undefined);
  const markOverlayCountRef = useRef(0);
  const paintFpRef = useRef('');
  const marksFpRef = useRef('');
  const markOverlayPageRef = useRef(1);
  const lastRequestPageRef = useRef<number | null>(null);
  const onBookmarksRef = useRef(onBookmarks);
  onBookmarksRef.current = onBookmarks;
  const [pageWindow, setPageWindow] = useState({ start: 1, end: 1 });

  const highlightsRef = useRef(highlights);
  const activePenColorRef = useRef(activePenColor);
  const flashNodeIdRef = useRef(flashNodeId);
  const presentationRef = useRef(modulePresentation);
  const showBlocksRef = useRef(showSelectionBlocks);
  const highlightParasRef = useRef(highlightParagraphs);
  const contentOnlyRef = useRef(contentOnlyVisual);
  const visualPeelModeRef = useRef(visualPeelMode);
  const untaggedTextVisibleRef = useRef(untaggedTextVisible);
  const onPageTextRef = useRef(onPageText);
  const onTextStatusRef = useRef(onTextStatus);
  const onStructureRef = useRef(onStructureAnalyzed);
  const onDiagnosticsRef = useRef(onDiagnostics);
  const onHighlightClickRef = useRef(onHighlightClick);
  const onPageChangeRef = useRef(onPageChange);
  const onZoomChangeRef = useRef(onZoomChange);
  const onNumPagesRef = useRef(onNumPages);
  const onPenStrokeRef = useRef(onPenStroke);
  const onTextSelectedRef = useRef(onTextSelected);
  const pageNumberRef = useRef(pageNumber);
  const scaleRef = useRef(scale);
  const analyzeStructureRef = useRef<(force?: boolean) => void>(() => undefined);

  highlightsRef.current = highlights;
  activePenColorRef.current = activePenColor;
  flashNodeIdRef.current = flashNodeId;
  presentationRef.current = modulePresentation;
  showBlocksRef.current = showSelectionBlocks;
  highlightParasRef.current = highlightParagraphs;
  contentOnlyRef.current = contentOnlyVisual;
  visualPeelModeRef.current = visualPeelMode;
  untaggedTextVisibleRef.current = untaggedTextVisible;
  onPageTextRef.current = onPageText;
  onTextStatusRef.current = onTextStatus;
  onStructureRef.current = onStructureAnalyzed;
  onDiagnosticsRef.current = onDiagnostics;
  onHighlightClickRef.current = onHighlightClick;
  onPageChangeRef.current = onPageChange;
  onZoomChangeRef.current = onZoomChange;
  onNumPagesRef.current = onNumPages;
  onPenStrokeRef.current = onPenStroke;
  onTextSelectedRef.current = onTextSelected;
  pageNumberRef.current = pageNumber;
  scaleRef.current = scale;

  useEffect(() => {
    setScrollMode(loadScrollMode());
  }, []);

  /** Silence react-pdf's unavoidable AbortException warnings on TextLayer cancel. */
  useEffect(() => installTextLayerAbortFilter(), []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SCROLL_MODE_KEY, scrollMode);
    } catch {
      /* ignore */
    }
  }, [scrollMode]);

  /**
   * Sticky / expanding page window for continuous mode.
   * Avoid remounting ±1 on every page tick (major source of TextLayer AbortException).
   * Off-window pages keep spacer height (virtualization) so scroll position stays stable.
   */
  useEffect(() => {
    if (!numPages) {
      setPageWindow({ start: pageNumber, end: pageNumber });
      return;
    }
    if (scrollMode === 'single') {
      setPageWindow({ start: pageNumber, end: pageNumber });
      return;
    }
    const desiredStart = Math.max(1, pageNumber - 1);
    const desiredEnd = Math.min(numPages, pageNumber + 1);
    setPageWindow((prev) => {
      let start = Math.min(prev.start, desiredStart);
      let end = Math.max(prev.end, desiredEnd);
      start = Math.min(start, desiredStart);
      end = Math.max(end, desiredEnd);
      const maxSpan = 7;
      if (end - start + 1 > maxSpan) {
        start = Math.max(1, pageNumber - 3);
        end = Math.min(numPages, pageNumber + 3);
      }
      if (start === prev.start && end === prev.end) {
        return prev;
      }
      return { start, end };
    });
  }, [numPages, pageNumber, scrollMode]);

  const visiblePages = useMemo(() => {
    const start = pageWindow.start;
    const end = pageWindow.end;
    const pages: number[] = [];
    for (let p = start; p <= end; p += 1) {
      pages.push(p);
    }
    return pages.length > 0 ? pages : [pageNumber];
  }, [pageNumber, pageWindow.end, pageWindow.start]);

  /** All page slots for continuous virtualization (mounted + spacers). */
  const pageSlots = useMemo(() => {
    if (!numPages) {
      return [pageNumber];
    }
    if (scrollMode === 'single') {
      return [pageNumber];
    }
    return Array.from({ length: numPages }, (_, i) => i + 1);
  }, [numPages, pageNumber, scrollMode]);

  const estimatedPageHeight = useMemo(() => {
    const cache = pageHeightCacheRef.current;
    if (cache.size === 0) {
      return Math.round(842 * scale);
    }
    let sum = 0;
    cache.forEach((h) => {
      sum += h;
    });
    return Math.max(120, Math.round(sum / cache.size));
  }, [scale, pageWindow.start, pageWindow.end, numPages]);

  useEffect(() => {
    setPageNumber(1);
    setPageInput('1');
    setPageWindow({ start: 1, end: 1 });
    onPageChangeRef.current?.(1);
    setTextStatus('unknown');
    onTextStatusRef.current?.('unknown');
    pageModelRef.current = null;
    setPageCorpora({});
    pageHeightCacheRef.current.clear();
    analyzedForRef.current = '';
    setDiagnostics(null);
    onDiagnosticsRef.current?.(null);
    setOverlayRegions([]);
    setPeelMasks([]);
    setBlockOverlays([]);
    setMarkOverlays([]);
    markOverlayCountRef.current = 0;
    paintFpRef.current = '';
    marksFpRef.current = '';
    markOverlayPageRef.current = 1;
    lastRequestPageRef.current = null;
    setFindOpen(false);
    setFindQuery('');
    setFindIndex(0);
    setFindBoxes([]);
    onBookmarksRef.current?.([]);
  }, [fileUrl]);

  useEffect(() => {
    onZoomChangeRef.current?.(scale);
  }, [scale]);

  useEffect(() => {
    setPageInput(String(pageNumber));
  }, [pageNumber]);

  const syncTextLayerChrome = useCallback((pageEl: HTMLElement | null) => {
    if (!pageEl) {
      return;
    }
    const textLayer = pageEl.querySelector<HTMLElement>(
      '.react-pdf__Page__textContent, .textLayer',
    );
    if (textLayer) {
      textLayer.classList.add('orc-text-layer');
      textLayer.style.pointerEvents = 'auto';
      textLayer.style.opacity = '1';
      textLayer.style.userSelect = 'text';
    }
    pageEl.classList.add('orc-pdf-page');
  }, []);

  const paintPresentation = useCallback(() => {
    const root = containerRef.current;
    const model = pageModelRef.current;
    if (!root || !model) {
      return;
    }
    const page = pageNumberRef.current;
    const pageEl = getPageEl(root, page);
    if (!pageEl) {
      return;
    }
    syncTextLayerChrome(pageEl);

    const spans = pageEl.querySelectorAll<HTMLElement>(
      '.react-pdf__Page__textContent span, .textLayer span',
    );
    // TextLayer empty mid-zoom/remount — keep previous tô overlays (no blink).
    if (spans.length === 0) {
      return;
    }

    const presentation = presentationRef.current;
    const currentHighlights = highlightsRef.current;
    const pen = activePenColorRef.current;
    const flashId = flashNodeIdRef.current;
    const paintFp = [
      page,
      scaleRef.current,
      model.items.length,
      model.regions.length,
      currentHighlights.map((h) => h.id).join(','),
      flashId ?? '',
      pen ?? '',
      showBlocksRef.current ? '1' : '0',
      highlightParasRef.current ? '1' : '0',
      contentOnlyRef.current ? '1' : '0',
      visualPeelModeRef.current,
      untaggedTextVisibleRef.current ? '1' : '0',
      Object.entries(presentation)
        .map(([k, v]) => `${k}:${v?.visible ? 1 : 0}${v?.highlight ? 1 : 0}${v?.focus ? 1 : 0}`)
        .join(';'),
    ].join('|');
    // Same paint inputs — skip DOM thrash (was remounting TextLayer in a loop).
    if (paintFpRef.current === paintFp && !zoomingRef.current) {
      return;
    }
    paintFpRef.current = paintFp;

    // Structure overlays are px-based (stale during zoom) — only refresh when stable.
    if (!zoomingRef.current) {
      const nextRegions = model.regions.filter((r) =>
        isModuleHighlighted(presentation, r.moduleId),
      );
      setOverlayRegions((prev) =>
        prev.length === nextRegions.length &&
        prev.every((r, i) => r.id === nextRegions[i]?.id)
          ? prev
          : nextRegions,
      );

      // Visual peel masks — cover watermark/signature on the PDF canvas (raw PDF untouched).
      const nextPeel = buildPeelVisualMasks(model, presentation);
      setPeelMasks((prev) =>
        prev.length === nextPeel.length &&
        prev.every((m, i) => m.id === nextPeel[i]?.id && m.left === nextPeel[i]?.left)
          ? prev
          : nextPeel,
      );

      if (showBlocksRef.current || highlightParasRef.current || contentOnlyRef.current) {
        const nextBlocks = model.blocks
          .filter((b) => {
            if (contentOnlyRef.current) {
              return b.role === 'table-cell' || b.role === 'table';
            }
            return b.role === 'body' || showBlocksRef.current;
          })
          .slice(0, contentOnlyRef.current ? 200 : 80)
          .map((b) => ({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h, role: b.role }));
        setBlockOverlays((prev) =>
          prev.length === nextBlocks.length &&
          prev.every((b, i) => b.id === nextBlocks[i]?.id)
            ? prev
            : nextBlocks,
        );
      } else {
        setBlockOverlays((prev) => (prev.length === 0 ? prev : []));
      }
    }

    const watermarkIds = new Set(
      model.regions
        .filter((r) => r.moduleId === 'watermark' || r.kind === 'watermark')
        .flatMap((r) => r.itemIds),
    );
    for (const it of model.items) {
      if (it.flags?.watermark) {
        watermarkIds.add(it.id);
      }
      // Diagonal chrome often misses word cues — peel when WM module hidden
      const rot = Math.abs(it.rotationDeg ?? 0);
      if (rot > 12 && rot < 168) {
        watermarkIds.add(it.id);
      }
    }
    const peeledIds = new Set<string>([
      ...watermarkIds,
      ...model.regions
        .filter((r) =>
          ['signature', 'stamp', 'digital-signature', 'rotated-text', 'logo', 'qr-code'].includes(
            r.moduleId ?? '',
          ),
        )
        .flatMap((r) => r.itemIds),
    ]);
    const pageRect = pageEl.getBoundingClientRect();
    const pw = pageRect.width || 1;
    const ph = pageRect.height || 1;
    const nextMarks: Array<{
      key: string;
      markId: string;
      color: string;
      flash: boolean;
      left: number;
      top: number;
      width: number;
      height: number;
    }> = [];
    let markIndex = 0;

    spans.forEach((el) => {
      const itemId = el.dataset.orcItemId ?? '';
      const mod = moduleForItem(model, itemId);

      let nextOpacity = '';
      let nextOutline = '';
      let nextBg = '';
      let nextPointer: string = 'auto';
      let nextCursor = pen ? 'crosshair' : 'text';
      let nextMarkId = '';
      let peel = false;
      const fadePeel = visualPeelModeRef.current === 'fade';
      const peeledOpacity = fadePeel ? '0.28' : '0';

      // Content-only: strip diagonal TextLayer glyphs even when itemId mapping missed (duplicate WM).
      if (contentOnlyRef.current) {
        const transform = el.style.transform || '';
        const rotMatch = /rotate\(\s*([-\d.]+)deg\s*\)/i.exec(transform);
        const rotCss = rotMatch ? Math.abs(Number(rotMatch[1])) : 0;
        if (rotCss > 12 && rotCss < 168) {
          peel = true;
          nextOpacity = peeledOpacity;
          nextPointer = 'none';
        }
      }

      // Body plane = untagged glyphs. When body focused/kept, keep them; else peel.
      if (!peel && !mod) {
        if (!untaggedTextVisibleRef.current) {
          peel = true;
          nextOpacity = peeledOpacity;
          nextPointer = 'none';
        }
      } else if (!peel && !isItemVisibleInPresentation(presentation, mod)) {
        peel = true;
        nextOpacity = peeledOpacity;
        nextPointer = 'none';
      } else if (
        !peel &&
        itemId &&
        watermarkIds.has(itemId) &&
        (contentOnlyRef.current || isModuleHidden(presentation, 'watermark'))
      ) {
        // Content-only / Clean Desk: always strip diagonal WM from TextLayer (canvas already hidden).
        peel = true;
        nextOpacity = peeledOpacity;
        nextPointer = 'none';
      } else if (
        !peel &&
        itemId &&
        peeledIds.has(itemId) &&
        (contentOnlyRef.current || isModuleHidden(presentation, mod ?? 'watermark'))
      ) {
        peel = true;
        nextOpacity = peeledOpacity;
        nextPointer = 'none';
      } else if (!peel && mod && isModuleHighlighted(presentation, mod)) {
        nextOutline = '1px solid color-mix(in srgb, var(--accent) 70%, transparent)';
        nextBg = 'color-mix(in srgb, var(--accent) 18%, transparent)';
      }

      if (peel) {
        if (el.dataset.orcPeel !== '1') {
          el.dataset.orcPeel = '1';
        }
      } else if (el.dataset.orcPeel) {
        delete el.dataset.orcPeel;
      }

      // Apply only when changed — avoid style thrash → TextLayer remount loop
      if (el.style.opacity !== nextOpacity) {
        el.style.opacity = nextOpacity;
      }
      if (el.style.outline !== nextOutline) {
        el.style.outline = nextOutline;
      }
      if (el.style.backgroundColor !== nextBg) {
        el.style.backgroundColor = nextBg;
      }
      if (el.style.boxShadow) {
        el.style.boxShadow = '';
      }
      if (el.style.pointerEvents !== nextPointer) {
        el.style.pointerEvents = nextPointer;
      }
      if (el.style.cursor !== nextCursor) {
        el.style.cursor = nextCursor;
      }

      if (peel || nextOpacity === '0' || nextOpacity === '0.28' || nextPointer === 'none') {
        if (el.dataset.orcMarkId) {
          el.dataset.orcMarkId = '';
        }
        el.onclick = null;
        return;
      }

      const text = (el.textContent ?? '').trim();
      if (!text) {
        if (el.dataset.orcMarkId) {
          el.dataset.orcMarkId = '';
        }
        el.onclick = null;
        return;
      }
      const norm = normalizeMatch(text);
      const match = currentHighlights.find((h) => {
        if (h.pageNumber !== page) {
          return false;
        }
        const ht = normalizeMatch(h.text);
        if (!ht) {
          return false;
        }
        const probe = ht.slice(0, Math.min(48, ht.length));
        return (
          norm.includes(probe) ||
          ht.includes(norm) ||
          model.blocks.some(
            (b) =>
              b.role !== 'watermark' &&
              normalizeMatch(b.text).includes(ht) &&
              (norm.includes(probe.slice(0, 12)) || ht.includes(norm.slice(0, 12))),
          )
        );
      });
      if (!match) {
        if (el.dataset.orcMarkId) {
          el.dataset.orcMarkId = '';
        }
        el.onclick = null;
        return;
      }
      nextMarkId = match.id;
      if (el.dataset.orcMarkId !== nextMarkId) {
        el.dataset.orcMarkId = nextMarkId;
      }
      el.onclick = (ev) => {
        ev.stopPropagation();
        onHighlightClickRef.current(match);
      };
      const spanRect = el.getBoundingClientRect();
      if (spanRect.width < 0.5 || spanRect.height < 0.5) {
        return;
      }
      nextMarks.push({
        key: `${match.id}-${markIndex}`,
        markId: match.id,
        color: match.color,
        flash: Boolean(match.flash || (flashId && match.nodeId === flashId)),
        left: ((spanRect.left - pageRect.left) / pw) * 100,
        top: ((spanRect.top - pageRect.top) / ph) * 100,
        width: (spanRect.width / pw) * 100,
        height: (spanRect.height / ph) * 100,
      });
      markIndex += 1;
    });

    // Partial TextLayer during zoom can match fewer spans — keep last full tô set.
    if (
      zoomingRef.current &&
      markOverlayCountRef.current > 0 &&
      nextMarks.length < markOverlayCountRef.current * 0.5
    ) {
      return;
    }
    const marksFp = nextMarks
      .map(
        (m) =>
          `${m.markId}:${m.left.toFixed(2)}:${m.top.toFixed(2)}:${m.width.toFixed(2)}:${m.height.toFixed(2)}:${m.flash ? 1 : 0}`,
      )
      .join('|');
    if (marksFpRef.current === marksFp && markOverlayPageRef.current === page) {
      return;
    }
    marksFpRef.current = marksFp;
    markOverlayCountRef.current = nextMarks.length;
    markOverlayPageRef.current = page;
    setMarkOverlayPage(page);
    setMarkOverlays(nextMarks);
  }, [syncTextLayerChrome]);

  const analyzeStructure = useCallback(
    (force = false) => {
      const root = containerRef.current;
      if (!root) {
        return;
      }
      const page = pageNumberRef.current;
      const pageEl = getPageEl(root, page);
      if (!pageEl) {
        return;
      }
      syncTextLayerChrome(pageEl);
      const key = `${fileUrl}|${page}|${scaleRef.current}|${scrollMode}`;
      if (!force && analyzedForRef.current === key && pageModelRef.current) {
        paintPresentation();
        return;
      }

      const spanCount = pageEl.querySelectorAll(
        '.react-pdf__Page__textContent span, .textLayer span',
      ).length;
      const prev = pageModelRef.current;
      // Mid-zoom / TextLayer remount: empty DOM would publish Diag 0% — keep last good.
      if (spanCount === 0 || (zoomingRef.current && spanCount < 3)) {
        if (prev && prev.diagnostics.pageNumber === page) {
          paintPresentation();
        }
        return;
      }

      const model = analyzePageElement(pageEl, page);
      if (
        prev &&
        prev.diagnostics.pageNumber === page &&
        prev.items.length > 0 &&
        (model.items.length === 0 ||
          (prev.items.length >= 10 &&
            model.items.length < Math.floor(prev.items.length * 0.5)))
      ) {
        // Incomplete TextLayer (zoom remount) — keep Diag / model; avoid 0% flash.
        paintPresentation();
        return;
      }

      pageModelRef.current = model;
      analyzedForRef.current = key;
      if (model.corpus) {
        setPageCorpora((prev) =>
          prev[page] === model.corpus ? prev : { ...prev, [page]: model.corpus },
        );
      }
      const wrap = root.querySelector<HTMLElement>(pageWrapSelector(page));
      if (wrap?.offsetHeight) {
        pageHeightCacheRef.current.set(page, wrap.offsetHeight);
      }
      setDiagnostics(model.diagnostics);
      onDiagnosticsRef.current?.(model.diagnostics);
      setTextStatus(model.hasUsableText ? 'ready' : 'empty');
      onTextStatusRef.current?.(model.hasUsableText ? 'ready' : 'empty');
      onPageTextRef.current?.(page, model.corpus);

      const flags: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(model.moduleFlags ?? {})) {
        if (v) {
          flags[k] = true;
        }
      }
      onStructureRef.current?.({
        pageNumber: page,
        regions: model.regions,
        flags,
        headerText: headerTextFromRegions(model.regions),
        footerText: footerTextFromRegions(model.regions),
        diagnostics: model.diagnostics,
        pageWidth: model.pageWidth,
        pageHeight: model.pageHeight,
        capabilities: model.regionGraph?.capabilities,
        objects: toObjectInsights(model),
      });

      paintPresentation();
    },
    [fileUrl, paintPresentation, scrollMode, syncTextLayerChrome],
  );
  analyzeStructureRef.current = analyzeStructure;

  // Fingerprint presentation — avoid effect churn from new object refs each parent render.
  const presentationFp = useMemo(
    () =>
      Object.entries(modulePresentation)
        .map(([k, v]) => `${k}:${v?.visible ? 1 : 0}${v?.highlight ? 1 : 0}${v?.focus ? 1 : 0}`)
        .join(';'),
    [modulePresentation],
  );
  const highlightsFp = useMemo(
    () => highlights.map((h) => `${h.id}:${h.pageNumber}:${h.color}`).join('|'),
    [highlights],
  );

  useEffect(() => {
    const id = window.setTimeout(() => paintPresentation(), 16);
    return () => window.clearTimeout(id);
  }, [
    paintPresentation,
    highlightsFp,
    activePenColor,
    flashNodeId,
    presentationFp,
    showSelectionBlocks,
    highlightParagraphs,
    contentOnlyVisual,
    visualPeelMode,
    untaggedTextVisible,
  ]);

  // Re-analyze on page/mode change only — zoom waits for TextLayer success
  // (early analyze on stale DOM causes overlay jump / flicker).
  useEffect(() => {
    analyzedForRef.current = '';
    const id = window.setTimeout(() => analyzeStructure(true), 50);
    return () => window.clearTimeout(id);
  }, [analyzeStructure, pageNumber, numPages, scrollMode]);

  // Continuous: sync current page from scroll (debounced to cut cancel churn)
  useEffect(() => {
    if (scrollMode !== 'continuous') {
      return;
    }
    const root = containerRef.current;
    if (!root) {
      return;
    }
    const wraps = [...root.querySelectorAll<HTMLElement>('[data-orc-page-wrap]')];
    if (wraps.length === 0) {
      return;
    }
    let timer: number | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressObserverRef.current || zoomingRef.current) {
          return;
        }
        let best: { page: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const page = Number((entry.target as HTMLElement).dataset.orcPageWrap);
          if (!Number.isFinite(page)) {
            continue;
          }
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { page, ratio: entry.intersectionRatio };
          }
        }
        if (!best || best.page === pageNumberRef.current) {
          return;
        }
        window.clearTimeout(timer);
        const next = best.page;
        timer = window.setTimeout(() => {
          if (suppressObserverRef.current || zoomingRef.current || next === pageNumberRef.current) {
            return;
          }
          setPageNumber(next);
          onPageChangeRef.current?.(next);
        }, 120);
      },
      { root, threshold: [0.4, 0.6] },
    );
    wraps.forEach((w) => observer.observe(w));
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [scrollMode, visiblePages]);

  const finishZoomStabilize = useCallback(() => {
    if (!zoomingRef.current) {
      return;
    }
    const root = containerRef.current;
    const anchor = zoomAnchorRef.current;
    zoomAnchorRef.current = null;
    if (root && anchor) {
      const wrap = root.querySelector<HTMLElement>(pageWrapSelector(anchor.page));
      if (wrap) {
        const rootRect = root.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        const currentOffset = wrapRect.top - rootRect.top;
        root.scrollTop += currentOffset - anchor.offset;
      }
    }
    root?.querySelectorAll<HTMLElement>('[data-orc-page-wrap]').forEach((el) => {
      el.style.minHeight = '';
      const inner = el.firstElementChild as HTMLElement | null;
      if (inner) {
        inner.style.minHeight = '';
        inner.style.minWidth = '';
      }
    });
    // Unlock paint immediately so structure overlays can refresh; keep IO suppressed briefly.
    zoomingRef.current = false;
    window.clearTimeout(zoomUnlockTimerRef.current);
    zoomUnlockTimerRef.current = window.setTimeout(() => {
      suppressObserverRef.current = false;
    }, 280);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(zoomUnlockTimerRef.current);
    },
    [],
  );

  const applyScale = useCallback(
    (next: number) => {
      const clamped = Math.min(2.5, Math.max(0.6, Number(next.toFixed(2))));
      if (clamped === scaleRef.current) {
        return;
      }
      const root = containerRef.current;
      const page = pageNumberRef.current;
      const wrap = root?.querySelector<HTMLElement>(pageWrapSelector(page));
      if (root && wrap) {
        const rootRect = root.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        zoomAnchorRef.current = {
          page,
          offset: wrapRect.top - rootRect.top,
        };
        // Lock wrap + inner page box so tô overlays (%) stay painted during remount
        root.querySelectorAll<HTMLElement>('[data-orc-page-wrap]').forEach((el) => {
          el.style.minHeight = `${Math.max(el.offsetHeight, 1)}px`;
          const inner = el.firstElementChild as HTMLElement | null;
          if (inner) {
            inner.style.minHeight = `${Math.max(inner.offsetHeight, 1)}px`;
            inner.style.minWidth = `${Math.max(inner.offsetWidth, 1)}px`;
          }
        });
      } else {
        zoomAnchorRef.current = null;
      }

      zoomingRef.current = true;
      suppressObserverRef.current = true;
      analyzedForRef.current = '';
      paintFpRef.current = '';
      marksFpRef.current = '';
      // Structure overlays use px — clear. Knowledge tô uses % — keep (no blink).
      setOverlayRegions([]);
      setBlockOverlays([]);
      setScale(clamped);

      // Fallback if TextLayer success is slow/cancelled
      window.clearTimeout(zoomUnlockTimerRef.current);
      zoomUnlockTimerRef.current = window.setTimeout(() => {
        if (zoomingRef.current) {
          finishZoomStabilize();
          analyzeStructureRef.current(true);
        }
      }, 600);
    },
    [finishZoomStabilize],
  );

  useEffect(() => {
    if (!selectionBridgeRef) {
      return;
    }
    selectionBridgeRef.current = {
      capture: () => {
        const selection = window.getSelection();
        const root = containerRef.current;
        if (!selection || !root) {
          return null;
        }
        const resolved = resolvePageFromNode(root, selection.anchorNode, pageNumberRef.current);
        // Prefer model for active page; if selection on neighbor, re-analyze quickly
        let model = pageModelRef.current;
        if (resolved.pageNumber !== pageNumberRef.current && resolved.pageEl) {
          model = analyzePageElement(resolved.pageEl, resolved.pageNumber);
        }
        const text = selectionTextFromModel(selection, model, resolved.pageEl);
        if (!text) {
          return null;
        }
        return {
          text,
          pageNumber: resolved.pageNumber,
          structureRef: structureRefFromSelection(selection, model, resolved.pageEl),
        };
      },
    };
    return () => {
      selectionBridgeRef.current = null;
    };
  }, [selectionBridgeRef]);

  const goToPage = useCallback((next: number) => {
    const clamped = Math.min(Math.max(1, next), numPages || 1);
    const alreadyThere = clamped === pageNumberRef.current;
    suppressObserverRef.current = true;
    if (!alreadyThere) {
      setPageNumber(clamped);
    }
    onPageChangeRef.current?.(clamped);

    const tryScroll = (attempt: number) => {
      const wrap = containerRef.current?.querySelector<HTMLElement>(
        pageWrapSelector(clamped),
      );
      if (wrap) {
        // Skip redundant smooth scroll when already on page (avoids IO fight / flicker).
        if (!alreadyThere || attempt > 0) {
          wrap.scrollIntoView({
            block: 'start',
            behavior: attempt === 0 ? 'smooth' : 'auto',
          });
        }
        window.setTimeout(() => {
          suppressObserverRef.current = false;
        }, 450);
        return;
      }
      if (attempt < 10) {
        window.setTimeout(() => tryScroll(attempt + 1), 40);
        return;
      }
      suppressObserverRef.current = false;
    };
    window.requestAnimationFrame(() => tryScroll(0));
  }, [numPages]);

  // Outline jump — consume each requestPage once.
  // Do NOT clear lastRequestPageRef on null (that re-fires the same page → parent loop).
  useEffect(() => {
    if (requestPage == null || requestPage < 1) {
      return;
    }
    if (lastRequestPageRef.current === requestPage) {
      return;
    }
    lastRequestPageRef.current = requestPage;
    goToPage(requestPage);
  }, [requestPage, goToPage]);

  // Clean Desk: fit a layout region into the Evidence viewport (jump + zoom + scroll).
  const lastFocusNonceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!requestFocusRegion || requestFocusRegion.w <= 0 || requestFocusRegion.h <= 0) {
      return;
    }
    if (lastFocusNonceRef.current === requestFocusRegion.nonce) {
      return;
    }
    lastFocusNonceRef.current = requestFocusRegion.nonce;

    const target = requestFocusRegion;
    goToPage(target.pageNumber);

    const runFit = (attempt: number) => {
      const root = containerRef.current;
      if (!root) {
        if (attempt < 20) {
          window.setTimeout(() => runFit(attempt + 1), 50);
        }
        return;
      }
      const pageEl = getPageEl(root, target.pageNumber);
      if (!pageEl) {
        if (attempt < 20) {
          window.setTimeout(() => runFit(attempt + 1), 50);
        }
        return;
      }
      const pw = target.pageWidth || 1;
      const ph = target.pageHeight || 1;
      const availW = Math.max(120, root.clientWidth - 40);
      const availH = Math.max(120, root.clientHeight - 48);
      const pageWAt1 = pageEl.clientWidth / Math.max(scaleRef.current, 0.01);
      const pageHAt1 = pageEl.clientHeight / Math.max(scaleRef.current, 0.01);
      const regionW1 = (target.w / pw) * pageWAt1;
      const regionH1 = (target.h / ph) * pageHAt1;
      let nextScale = Math.min(availW / Math.max(regionW1, 8), availH / Math.max(regionH1, 8)) * 0.88;
      nextScale = Math.min(2.5, Math.max(0.7, Number(nextScale.toFixed(2))));
      if (Math.abs(nextScale - scaleRef.current) > 0.04) {
        applyScale(nextScale);
      }

      window.setTimeout(() => {
        const pageEl2 = getPageEl(root, target.pageNumber);
        if (!pageEl2) return;
        const top = (target.y / ph) * pageEl2.clientHeight;
        const left = (target.x / pw) * pageEl2.clientWidth;
        const height = (target.h / ph) * pageEl2.clientHeight;
        const width = (target.w / pw) * pageEl2.clientWidth;
        const pageRect = pageEl2.getBoundingClientRect();
        const rootRect = root.getBoundingClientRect();
        const regionCenterY = pageRect.top - rootRect.top + root.scrollTop + top + height / 2;
        const regionCenterX = pageRect.left - rootRect.left + root.scrollLeft + left + width / 2;
        root.scrollTo({
          top: Math.max(0, regionCenterY - root.clientHeight / 2),
          left: Math.max(0, regionCenterX - root.clientWidth / 2),
          behavior: 'smooth',
        });
      }, Math.abs(nextScale - scaleRef.current) > 0.04 ? 180 : 40);
    };

    window.requestAnimationFrame(() => runFit(0));
  }, [requestFocusRegion, goToPage, applyScale]);

  function commitPageInput() {
    const n = Number.parseInt(pageInput, 10);
    if (Number.isFinite(n)) {
      goToPage(n);
    } else {
      setPageInput(String(pageNumber));
    }
  }

  const findMatches = useMemo(
    () =>
      findInPageCorpora(pageCorpora, {
        query: findQuery,
        caseSensitive: false,
      }),
    [findQuery, pageCorpora],
  );

  const refreshFindBoxes = useCallback(
    (page: number, query: string) => {
      const pageEl = getPageEl(containerRef.current!, page);
      if (!pageEl || !query.trim()) {
        setFindBoxes([]);
        return;
      }
      setFindBoxes(findMatchBoxesStrict(pageEl, query, false));
    },
    [],
  );

  useEffect(() => {
    if (!findOpen || !findQuery.trim()) {
      setFindBoxes([]);
      return;
    }
    const id = window.setTimeout(() => {
      refreshFindBoxes(pageNumberRef.current, findQuery);
    }, 40);
    return () => window.clearTimeout(id);
  }, [findOpen, findQuery, pageNumber, scale, refreshFindBoxes, textStatus]);

  const goFindIndex = useCallback(
    (nextIndex: number) => {
      if (findMatches.length === 0) {
        setFindIndex(0);
        return;
      }
      const idx = ((nextIndex % findMatches.length) + findMatches.length) % findMatches.length;
      setFindIndex(idx);
      const match = findMatches[idx]!;
      if (match.pageNumber !== pageNumberRef.current) {
        goToPage(match.pageNumber);
      }
      window.setTimeout(() => refreshFindBoxes(match.pageNumber, findQuery), 80);
    },
    [findMatches, findQuery, goToPage, refreshFindBoxes],
  );

  const toggleFind = useCallback(() => {
    setFindOpen((open) => {
      const next = !open;
      if (next) {
        window.setTimeout(() => findInputRef.current?.focus(), 30);
      } else {
        setFindBoxes([]);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
          // Allow native find in other fields unless focus is in PDF chrome
          if (!t.closest?.('.orc-pdf-scroll') && !t.closest?.('[data-orc-pdf-toolbar]')) {
            return;
          }
        }
        e.preventDefault();
        setFindOpen(true);
        window.setTimeout(() => findInputRef.current?.focus(), 30);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function fitWidth() {
    const root = containerRef.current;
    if (!root) {
      return;
    }
    const pageEl = getPageEl(root, pageNumberRef.current);
    const canvas = pageEl?.querySelector('canvas');
    if (!canvas) {
      return;
    }
    const avail = root.clientWidth - 24;
    const natural = canvas.width / (window.devicePixelRatio || 1) / scaleRef.current;
    if (natural > 0 && avail > 0) {
      applyScale(avail / natural);
    }
  }

  function handleMouseUp(e: React.MouseEvent) {
    const selection = window.getSelection();
    const root = containerRef.current;
    if (!selection || !root) {
      return;
    }
    const resolved = resolvePageFromNode(root, selection.anchorNode, pageNumberRef.current);
    let model = pageModelRef.current;
    if (resolved.pageNumber !== pageNumberRef.current && resolved.pageEl) {
      model = analyzePageElement(resolved.pageEl, resolved.pageNumber);
      // Promote neighbor page to current for subsequent paint
      if (resolved.pageNumber !== pageNumberRef.current) {
        setPageNumber(resolved.pageNumber);
        onPageChangeRef.current?.(resolved.pageNumber);
        pageModelRef.current = model;
      }
    }
    const text = selectionTextFromModel(selection, model, resolved.pageEl);
    if (!text) {
      return;
    }
    const structureRef = structureRefFromSelection(selection, model, resolved.pageEl);
    if (activePenColorRef.current) {
      onPenStrokeRef.current({
        text,
        pageNumber: resolved.pageNumber,
        structureRef,
      });
      selection.removeAllRanges();
      return;
    }
    onTextSelectedRef.current({
      text,
      pageNumber: resolved.pageNumber,
      clientX: e.clientX,
      clientY: e.clientY,
      structureRef,
    });
  }

  const ignoreAbort = useCallback((err: Error) => {
    if (isAbortError(err)) {
      return;
    }
  }, []);

  const onActiveTextLayerSuccess = useCallback(
    (renderedPage: number) => {
      if (renderedPage !== pageNumberRef.current) {
        return;
      }
      window.requestAnimationFrame(() => {
        if (zoomingRef.current) {
          finishZoomStabilize();
        }
        const key = `${fileUrl}|${pageNumberRef.current}|${scaleRef.current}|${scrollMode}`;
        // Already analyzed this page/scale — paint only. Force re-analyze was looping.
        if (analyzedForRef.current === key && pageModelRef.current) {
          paintPresentation();
          return;
        }
        analyzeStructure(true);
      });
    },
    [analyzeStructure, fileUrl, finishZoomStabilize, paintPresentation, scrollMode],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg)]">
      <div data-orc-pdf-toolbar="">
        <PdfViewerToolbar
          pageNumber={pageNumber}
          numPages={numPages}
          scale={scale}
          scrollMode={scrollMode}
          activePenColor={activePenColor}
          textStatus={textStatus}
          onPrev={() => goToPage(pageNumber - 1)}
          onNext={() => goToPage(pageNumber + 1)}
          onZoomOut={() => applyScale(scale - 0.1)}
          onZoomIn={() => applyScale(scale + 0.1)}
          onFitWidth={fitWidth}
          onToggleScrollMode={() =>
            setScrollMode((m) => (m === 'single' ? 'continuous' : 'single'))
          }
          pageInput={pageInput}
          onPageInputChange={setPageInput}
          onPageInputCommit={commitPageInput}
          findOpen={findOpen}
          findQuery={findQuery}
          findIndex={findIndex}
          findTotal={findMatches.length}
          onToggleFind={toggleFind}
          onFindQueryChange={(v) => {
            setFindQuery(v);
            setFindIndex(0);
          }}
          onFindPrev={() => goFindIndex(findIndex - 1)}
          onFindNext={() => goFindIndex(findIndex + 1)}
          findInputRef={findInputRef}
        />
      </div>

      <div
        ref={containerRef}
        className="orc-pdf-scroll min-h-0 flex-1 overflow-auto p-3"
        style={{ cursor: activePenColor ? 'crosshair' : undefined }}
        onMouseUp={handleMouseUp}
      >
        {error ? (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        ) : (
          <div className="relative mx-auto flex w-fit flex-col gap-4">
            <StructureDiagnosticsPanel
              open={diagOpen}
              onToggle={() => setDiagOpen(!diagOpen)}
              diagnostics={diagnostics}
            />
            <Document
              file={fileUrl}
              loading={<p className="text-sm text-[var(--muted)]">Đang tải PDF…</p>}
              onLoadSuccess={(info) => {
                setNumPages(info.numPages);
                onNumPagesRef.current?.(info.numPages);
                setError(null);
                void extractPdfBookmarks(info).then((entries) => {
                  onBookmarksRef.current?.(entries);
                });
              }}
              onLoadError={() => setError('Không mở được tệp PDF.')}
            >
              {pageSlots.map((p) => {
                const mounted =
                  scrollMode === 'single'
                    ? p === pageNumber
                    : p >= pageWindow.start && p <= pageWindow.end;
                if (!mounted) {
                  const h = pageHeightCacheRef.current.get(p) ?? estimatedPageHeight;
                  return (
                    <div
                      key={`slot-${p}`}
                      data-orc-page-wrap={p}
                      data-orc-page-spacer=""
                      className="mx-auto"
                      style={{ height: h, width: 'min(100%, 720px)' }}
                      aria-hidden
                    />
                  );
                }
                return (
                  <div
                    key={`slot-${p}`}
                    data-orc-page-wrap={p}
                    data-orc-content-only={
                      contentOnlyVisual && textStatus !== 'empty' ? '1' : undefined
                    }
                    data-orc-canvas-only={canvasOnlyVisual ? '1' : undefined}
                    data-orc-peel-mode={visualPeelMode === 'fade' ? 'fade' : 'cover'}
                    className="mx-auto w-fit"
                  >
                    {/* Inner relative box tracks Page size — not wrap minHeight during zoom. */}
                    <div className="relative w-fit">
                      <Page
                        pageNumber={p}
                        scale={scale}
                        loading={null}
                        renderTextLayer
                        renderAnnotationLayer={!contentOnlyVisual}
                        className="orc-pdf-page mx-auto shadow-sm"
                        onRenderTextLayerSuccess={() => onActiveTextLayerSuccess(p)}
                        onRenderTextLayerError={ignoreAbort}
                        onGetTextError={ignoreAbort}
                      />
                      {/* Peel masks when canvas still shown (Hiện đủ lớp, or no TextLayer). */}
                      {p === pageNumber &&
                      peelMasks.length > 0 &&
                      (!contentOnlyVisual || textStatus === 'empty') ? (
                        <div
                          className="pointer-events-none absolute inset-0 z-[1]"
                          aria-hidden
                          data-orc-peel-mask=""
                          data-orc-peel-mode={visualPeelMode === 'fade' ? 'fade' : 'cover'}
                        >
                          {peelMasks.map((m) => (
                            <div
                              key={m.id}
                              className="absolute"
                              title={
                                visualPeelMode === 'fade'
                                  ? `Đã làm mờ ${m.label}`
                                  : `Đã che ${m.label}`
                              }
                              style={
                                visualPeelMode === 'fade'
                                  ? {
                                      left: `${m.left}%`,
                                      top: `${m.top}%`,
                                      width: `${m.width}%`,
                                      height: `${m.height}%`,
                                      background: 'rgba(255, 255, 255, 0.58)',
                                      boxShadow:
                                        'inset 0 0 0 1px rgba(0, 120, 212, 0.28)',
                                    }
                                  : {
                                      left: `${m.left}%`,
                                      top: `${m.top}%`,
                                      width: `${m.width}%`,
                                      height: `${m.height}%`,
                                      background: '#ffffff',
                                      boxShadow: '0 0 6px 3px #ffffff',
                                    }
                              }
                            />
                          ))}
                        </div>
                      ) : null}
                      {p === pageNumber &&
                      p === markOverlayPage &&
                      markOverlays.length > 0 ? (
                        <div
                          className="pointer-events-none absolute inset-0 z-[2]"
                          aria-hidden
                          data-orc-mark-layer=""
                        >
                          {markOverlays.map((m) => (
                            <div
                              key={m.key}
                              className="absolute rounded-[1px]"
                              style={{
                                left: `${m.left}%`,
                                top: `${m.top}%`,
                                width: `${m.width}%`,
                                height: `${m.height}%`,
                                backgroundColor: `${m.color}66`,
                                boxShadow: `inset 0 0 0 1px ${m.color}`,
                                outline: m.flash ? `2px solid ${m.color}` : undefined,
                              }}
                            />
                          ))}
                        </div>
                      ) : null}
                      {p === pageNumber && findOpen && findBoxes.length > 0 ? (
                        <div
                          className="pointer-events-none absolute inset-0 z-[2]"
                          aria-hidden
                          data-orc-find-layer=""
                        >
                          {findBoxes.map((b, i) => (
                            <div
                              key={`find-${i}`}
                              className="absolute rounded-[1px]"
                              data-orc-find-hit={i === 0 ? 'active' : '1'}
                              style={{
                                left: `${b.left}%`,
                                top: `${b.top}%`,
                                width: `${b.width}%`,
                                height: `${b.height}%`,
                              }}
                            />
                          ))}
                        </div>
                      ) : null}
                      {p === pageNumber && showRecognitionMap && recognitionMapCells.length > 0 ? (
                        <div
                          className="pointer-events-none absolute inset-0 z-[1]"
                          aria-hidden
                          data-orc-recognition-map=""
                        >
                          {recognitionMapCells.map((c) => (
                            <div
                              key={c.id}
                              className="absolute rounded-[1px]"
                              style={{
                                left: `${c.left}%`,
                                top: `${c.top}%`,
                                width: `${Math.max(c.width, 0.8)}%`,
                                height: `${Math.max(c.height, 0.6)}%`,
                                border:
                                  c.source === 'region'
                                    ? '1px solid color-mix(in srgb, #605e5c 55%, transparent)'
                                    : '1px solid color-mix(in srgb, #0078d4 65%, transparent)',
                                background:
                                  c.source === 'region'
                                    ? 'color-mix(in srgb, #605e5c 8%, transparent)'
                                    : 'color-mix(in srgb, #0078d4 10%, transparent)',
                              }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      ) : null}
                      {p === pageNumber &&
                      (objectDebugBoxes || focusedObjectId) &&
                      objectInsights.length > 0 ? (
                        <div
                          className="pointer-events-none absolute inset-0 z-[2]"
                          aria-hidden
                          data-orc-object-layer=""
                        >
                          {objectInsights
                            .filter((o) => o.pageNumber === p)
                            .filter((o) => !hiddenObjectClasses?.has(o.class))
                            .filter(
                              (o) =>
                                objectDebugBoxes ||
                                o.id === focusedObjectId ||
                                (focusedObjectId &&
                                  o.class ===
                                    objectInsights.find((x) => x.id === focusedObjectId)?.class),
                            )
                            .map((o) => {
                              const focused = o.id === focusedObjectId;
                              return (
                                <div
                                  key={o.id}
                                  className="absolute rounded-[1px]"
                                  style={{
                                    left: `${o.left}%`,
                                    top: `${o.top}%`,
                                    width: `${o.width}%`,
                                    height: `${o.height}%`,
                                    border: focused
                                      ? '2px solid var(--accent)'
                                      : '1px dashed #8a8886',
                                    background: focused
                                      ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                                      : 'transparent',
                                  }}
                                  title={`${o.class} · ${o.confidence}`}
                                />
                              );
                            })}
                        </div>
                      ) : null}
                      {p === pageNumber && overlayRegions.length + blockOverlays.length > 0 ? (
                        <div className="pointer-events-none absolute inset-0 z-[4]">
                          {overlayRegions.map((r) => (
                            <div
                              key={r.id}
                              className="absolute rounded-sm border-2 border-[var(--accent)]"
                              style={{
                                left: r.x,
                                top: r.y,
                                width: r.w,
                                height: r.h,
                                background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                              }}
                              title={r.label}
                            />
                          ))}
                          {blockOverlays.map((b) => (
                            <div
                              key={b.id}
                              className={
                                b.role === 'table-cell' || b.role === 'table'
                                  ? 'absolute border border-[#605e5c]/55 bg-white/40'
                                  : 'absolute border border-dashed border-[#8a8886]/70'
                              }
                              style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
                              title={b.role === 'table-cell' ? 'Ô bảng' : undefined}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </Document>

            {textStatus === 'empty' ? (
              <div
                className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center px-3"
                role="status"
              >
                <p className="max-w-md rounded border border-[#c8c6c4] bg-[#fff4ce] px-3 py-2 text-center text-[12px] text-[var(--fg)] shadow-sm">
                  Không đọc được chữ trên trang này.
                  <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                    Ghi việc thủ công trên Bàn làm việc, hoặc dùng bản có chữ nhúng / chờ nguồn chữ được bật.
                    Không đoán nội dung giúp bạn.
                  </span>
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
