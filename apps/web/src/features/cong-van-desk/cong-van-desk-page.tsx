'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { KNOWLEDGE_NODES, type KnowledgeNodeId } from '@orc/shared';
import { documentFileUrl } from '../workspace/api';
import { useWorkspaceSession } from '../workspace/hooks/use-workspace-session';
import {
  suggestKnowledgeFields,
  type FieldSuggestion,
} from '../workspace/knowledge/suggest-knowledge-fields';
import { PdfViewer, type PageStructureSnapshot } from '../workspace/pdf-viewer';
import {
  type ModulePresentationMap,
} from '../workspace/hooks/use-structure-presentation';
import type { StructureModuleId } from '../workspace/pdf/plugins/types';
import {
  boundsForLayoutLayer,
  deriveLayoutLayers,
  modulesHiddenByDispositions,
  seedLayerDispositions,
  type LayerDisposition,
} from '../workspace/knowledge/layout-layers';
import { DeskLayerInspector } from './desk-layer-inspector';
import type { FocusRegionRequest } from '../workspace/pdf/viewer-types';

/** Essential dossier fields for first clean pass (office desk). */
export const DESK_FIELD_ORDER: KnowledgeNodeId[] = [
  'loai-van-ban',
  'so-van-ban',
  'ngay-ban-hanh',
  'trich-yeu',
  'don-vi-ban-hanh',
  'yeu-cau',
  'thoi-han',
  'nguoi-ky',
  'noi-nhan',
  'van-ban-lien-quan',
];

type StepOutcome = 'pending' | 'accepted' | 'skipped';

type DeskStep = {
  nodeId: KnowledgeNodeId;
  label: string;
  draft: string;
  pageNumber: number;
  suggestionId: string | null;
  reason: string | null;
  outcome: StepOutcome;
};

type Phase = 'review' | 'summary';

function labelOf(nodeId: string): string {
  return KNOWLEDGE_NODES.find((n) => n.id === nodeId)?.label ?? nodeId;
}

function buildSteps(
  suggestions: FieldSuggestion[],
  existing: { nodeId: string; text: string; pageNumber: number }[],
  prevSteps?: DeskStep[],
): DeskStep[] {
  const byNode = new Map<string, FieldSuggestion>();
  for (const s of suggestions) {
    if (!byNode.has(s.nodeId)) {
      byNode.set(s.nodeId, s);
    }
  }
  const existingByNode = new Map(existing.map((a) => [a.nodeId, a]));
  const prevByNode = new Map((prevSteps ?? []).map((s) => [s.nodeId, s]));

  return DESK_FIELD_ORDER.map((nodeId) => {
    const prev = prevByNode.get(nodeId);
    // Keep user decisions once made.
    if (prev && prev.outcome !== 'pending') {
      return prev;
    }
    const saved = existingByNode.get(nodeId);
    const sug = byNode.get(nodeId);
    if (saved?.text?.trim() && !prev) {
      return {
        nodeId,
        label: labelOf(nodeId),
        draft: saved.text,
        pageNumber: saved.pageNumber || sug?.pageNumber || 1,
        suggestionId: null,
        reason: 'Đã có trong phiên',
        outcome: 'accepted' as const,
      };
    }
    return {
      nodeId,
      label: labelOf(nodeId),
      draft: prev?.draft || sug?.text || '',
      pageNumber: sug?.pageNumber ?? prev?.pageNumber ?? 1,
      suggestionId: sug?.id ?? null,
      reason: sug?.reason ?? null,
      outcome: 'pending' as const,
    };
  });
}

type Props = { documentId: string };

/**
 * Trợ lý công văn — Clean Desk (PDR-007).
 * Single PDF mount · suggest refresh as pages load · Nhận / Sửa / ✕ → Lưu.
 */
export function CongVanDeskPage({ documentId }: Props) {
  const onEvent = useCallback(() => undefined, []);
  const session = useWorkspaceSession({
    documentId,
    onEvent,
  });

  const [pageTexts, setPageTexts] = useState<Record<number, string>>({});
  const [textStatus, setTextStatus] = useState<'unknown' | 'ready' | 'empty'>('unknown');
  const [requestPage, setRequestPage] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('review');
  const [steps, setSteps] = useState<DeskStep[]>(() => buildSteps([], []));
  const [index, setIndex] = useState(0);
  const [readingHint, setReadingHint] = useState(true);
  const seededRef = useRef(false);
  const lastJumpRef = useRef<number | null>(null);
  const [pageSnapshots, setPageSnapshots] = useState<Record<number, PageStructureSnapshot>>(
    {},
  );
  const [layerDispositions, setLayerDispositions] = useState<Record<string, LayerDisposition>>(
    {},
  );
  const [focusedLayerId, setFocusedLayerId] = useState<string | null>(null);
  const [isolating, setIsolating] = useState(false);
  const [focusRegionReq, setFocusRegionReq] = useState<FocusRegionRequest | null>(null);
  const [deskTab, setDeskTab] = useState<'fields' | 'layers'>('layers');

  const isPdf = session.doc?.extension === 'pdf';

  const layoutLayers = useMemo(
    () => deriveLayoutLayers(Object.values(pageSnapshots)),
    [pageSnapshots],
  );

  useEffect(() => {
    if (layoutLayers.length === 0) return;
    setLayerDispositions((prev) => seedLayerDispositions(layoutLayers, prev));
  }, [layoutLayers]);

  /** Presentation from layer keep/discard (+ isolate). */
  const deskPresentation = useMemo(() => {
    const next: Partial<ModulePresentationMap> = {};
    const hidden = modulesHiddenByDispositions(layoutLayers, layerDispositions);
    for (const id of hidden) {
      next[id] = { visible: false, highlight: false, focus: false };
    }
    if (isolating && focusedLayerId) {
      const focus = layoutLayers.find((l) => l.id === focusedLayerId);
      const keepMods = new Set(focus?.moduleIds ?? []);
      if (focus?.kind === 'watermark') {
        keepMods.add('watermark');
        keepMods.add('rotated-text');
      }
      if (focus?.kind === 'body') {
        keepMods.add('article');
        keepMods.add('clause');
        keepMods.add('point');
        keepMods.add('subject');
        keepMods.add('selectable-text-layer');
      }
      const allMods = new Set<StructureModuleId>();
      for (const l of layoutLayers) {
        for (const m of l.moduleIds) allMods.add(m);
      }
      allMods.add('watermark');
      allMods.add('rotated-text');
      allMods.add('header');
      allMods.add('footer');
      allMods.add('signature');
      allMods.add('stamp');
      allMods.add('logo');
      for (const m of allMods) {
        if (!keepMods.has(m)) {
          next[m] = { visible: false, highlight: false, focus: false };
        } else {
          next[m] = { visible: true, highlight: true, focus: true };
        }
      }
    } else if (focusedLayerId) {
      const focus = layoutLayers.find((l) => l.id === focusedLayerId);
      for (const m of focus?.moduleIds ?? []) {
        next[m] = {
          visible: next[m]?.visible !== false,
          highlight: true,
          focus: false,
        };
      }
    }
    return next;
  }, [layoutLayers, layerDispositions, focusedLayerId, isolating]);

  /** True when ≥1 layer is on the shelf — switch Evidence to «mặt đọc» (ẩn canvas). */
  const hasShelvedLayers = useMemo(() => {
    return layoutLayers.some((l) => {
      const d = layerDispositions[l.id] ?? l.defaultDisposition;
      return d === 'discard';
    });
  }, [layoutLayers, layerDispositions]);

  const bodyOnShelf = useMemo(() => {
    return layoutLayers.some((l) => {
      if (l.kind !== 'body') return false;
      const d = layerDispositions[l.id] ?? l.defaultDisposition;
      return d === 'discard';
    });
  }, [layoutLayers, layerDispositions]);

  const untaggedTextVisible = useMemo(() => {
    if (isolating && focusedLayerId) {
      const focus = layoutLayers.find((l) => l.id === focusedLayerId);
      return focus?.kind === 'body';
    }
    return !bodyOnShelf;
  }, [isolating, focusedLayerId, layoutLayers, bodyOnShelf]);

  /** Hide painted PDF when shelving — ink on canvas cannot be peeled like Photoshop. */
  const deskContentOnly =
    (hasShelvedLayers || isolating) && textStatus === 'ready';

  useEffect(() => {
    seededRef.current = false;
    lastJumpRef.current = null;
    setPageTexts({});
    setTextStatus('unknown');
    setRequestPage(null);
    setSteps(buildSteps([], []));
    setIndex(0);
    setPhase('review');
    setReadingHint(true);
    setPageSnapshots({});
    setLayerDispositions({});
    setFocusedLayerId(null);
    setIsolating(false);
    setFocusRegionReq(null);
    setDeskTab('layers');
  }, [documentId]);

  // Seed / refresh suggestions as page corpora grow — never remount PDF.
  useEffect(() => {
    if (!session.doc) {
      return;
    }
    const hasText = Object.values(pageTexts).some((t) => t.trim().length > 0);
    if (!hasText && textStatus === 'unknown') {
      return;
    }
    const suggestions = suggestKnowledgeFields(pageTexts, session.assignments);
    setSteps((prev) => {
      const next = buildSteps(suggestions, session.assignments, prev);
      if (
        prev.length === next.length &&
        prev.every(
          (s, i) =>
            s.nodeId === next[i]?.nodeId &&
            s.draft === next[i]?.draft &&
            s.outcome === next[i]?.outcome &&
            s.reason === next[i]?.reason &&
            s.pageNumber === next[i]?.pageNumber,
        )
      ) {
        return prev;
      }
      return next;
    });
    if (hasText || textStatus === 'empty') {
      if (!seededRef.current) {
        seededRef.current = true;
        setIndex(0);
        setPhase('review');
      }
      setReadingHint((h) => (h ? false : h));
    }
  }, [session.doc, session.assignments, pageTexts, textStatus]);

  // Unblock UI if PDF never reports status.
  useEffect(() => {
    if (!session.doc || !readingHint) {
      return;
    }
    const t = window.setTimeout(() => setReadingHint(false), 3500);
    return () => window.clearTimeout(t);
  }, [session.doc, readingHint]);

  const current = steps[index] ?? null;
  const pendingCount = steps.filter((s) => s.outcome === 'pending').length;
  const acceptedCount = steps.filter((s) => s.outcome === 'accepted').length;
  const skippedCount = steps.filter((s) => s.outcome === 'skipped').length;

  // Jump Evidence only when step/page actually changes — no null↔page ping-pong.
  useEffect(() => {
    if (phase !== 'review' || !current?.pageNumber) {
      return;
    }
    const page = current.pageNumber;
    if (lastJumpRef.current === page) {
      return;
    }
    lastJumpRef.current = page;
    setRequestPage(page);
  }, [phase, index, current?.pageNumber]);

  const onEvidencePageChange = useCallback((_page: number) => {
    setRequestPage(null);
  }, []);

  const onTextStatusStable = useCallback((status: 'unknown' | 'ready' | 'empty') => {
    setTextStatus((prev) => (prev === status ? prev : status));
  }, []);

  const advanceFrom = useCallback((from: number, updated: DeskStep[]) => {
    const next = updated.findIndex((s, i) => i > from && s.outcome === 'pending');
    if (next >= 0) {
      setIndex(next);
      setPhase('review');
      return;
    }
    const any = updated.findIndex((s) => s.outcome === 'pending');
    if (any >= 0) {
      setIndex(any);
      setPhase('review');
      return;
    }
    setPhase('summary');
  }, []);

  const onAccept = useCallback(() => {
    if (!current) {
      return;
    }
    const text = current.draft.trim();
    const at = index;
    if (!text) {
      setSteps((prev) => {
        const updated = prev.map((s, i) =>
          i === at ? { ...s, outcome: 'skipped' as const, draft: '' } : s,
        );
        queueMicrotask(() => advanceFrom(at, updated));
        return updated;
      });
      return;
    }
    setSteps((prev) => {
      const updated = prev.map((s, i) =>
        i === at ? { ...s, outcome: 'accepted' as const, draft: text } : s,
      );
      queueMicrotask(() => advanceFrom(at, updated));
      return updated;
    });
    session.pushHistory(session.assignments);
    const now = new Date().toISOString();
    const nodeId = current.nodeId;
    const pageNumber = current.pageNumber;
    const suggestionId = current.suggestionId;
    session.setAssignments((prev) => {
      const without = prev.filter((a) => a.nodeId !== nodeId);
      return [
        ...without,
        {
          id: crypto.randomUUID(),
          nodeId,
          text,
          pageNumber,
          createdAt: now,
          source: suggestionId ? ('auto' as const) : ('manual' as const),
        },
      ];
    });
    session.setDirty(true);
  }, [advanceFrom, current, index, session]);

  const onSkip = useCallback(() => {
    if (!current) {
      return;
    }
    const at = index;
    setSteps((prev) => {
      const updated = prev.map((s, i) =>
        i === at ? { ...s, outcome: 'skipped' as const } : s,
      );
      queueMicrotask(() => advanceFrom(at, updated));
      return updated;
    });
  }, [advanceFrom, current, index]);

  const onSave = useCallback(async () => {
    await session.save();
  }, [session]);

  const onPageText = useCallback((page: number, text: string) => {
    setPageTexts((prev) => {
      if (prev[page] === text) {
        return prev;
      }
      return { ...prev, [page]: text };
    });
  }, []);

  const onStructureAnalyzed = useCallback((snap: PageStructureSnapshot) => {
    setPageSnapshots((prev) => {
      const old = prev[snap.pageNumber];
      if (
        old &&
        old.regions.length === snap.regions.length &&
        (old.headerText ?? '') === (snap.headerText ?? '') &&
        (old.footerText ?? '') === (snap.footerText ?? '')
      ) {
        return prev;
      }
      return { ...prev, [snap.pageNumber]: snap };
    });
  }, []);

  const onLayerDisposition = useCallback((id: string, d: LayerDisposition) => {
    setLayerDispositions((prev) => ({ ...prev, [id]: d }));
  }, []);

  const emitFitForLayer = useCallback(
    (layerId: string) => {
      const layer = layoutLayers.find((l) => l.id === layerId);
      if (!layer) return;
      const bounds = boundsForLayoutLayer(layer, Object.values(pageSnapshots));
      if (bounds) {
        setFocusRegionReq({ ...bounds, nonce: Date.now() });
      } else if (layer.pageNumbers[0]) {
        setRequestPage(layer.pageNumbers[0]);
        window.setTimeout(() => setRequestPage(null), 0);
      }
    },
    [layoutLayers, pageSnapshots],
  );

  const onSelectLayer = useCallback(
    (layerId: string | null) => {
      if (!layerId) {
        setFocusedLayerId(null);
        setIsolating(false);
        return;
      }
      setFocusedLayerId(layerId);
      setIsolating(true);
      emitFitForLayer(layerId);
    },
    [emitFitForLayer],
  );

  const onFitLayer = useCallback(
    (layerId: string) => {
      setFocusedLayerId(layerId);
      emitFitForLayer(layerId);
    },
    [emitFitForLayer],
  );

  const onClearIsolate = useCallback(() => {
    setIsolating(false);
  }, []);

  const onDiscardChrome = useCallback(() => {
    setLayerDispositions((prev) => {
      const next = { ...prev };
      for (const l of layoutLayers) {
        if (
          l.kind === 'watermark' ||
          l.kind === 'signature' ||
          l.kind === 'header' ||
          l.kind === 'footer' ||
          l.kind === 'image'
        ) {
          next[l.id] = 'discard';
        }
      }
      return next;
    });
    setIsolating(false);
  }, [layoutLayers]);

  const onKeepAllContent = useCallback(() => {
    setLayerDispositions((prev) => {
      const next = { ...prev };
      for (const l of layoutLayers) {
        next[l.id] = 'keep';
      }
      return next;
    });
    setIsolating(false);
    setFocusedLayerId(null);
  }, [layoutLayers]);

  if (!session.doc) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#f3f2f1] px-6 text-center text-sm text-[#605e5c]">
        <p>{session.error ?? session.status}</p>
        {session.error ? (
          <p className="max-w-md text-[12px]">
            Thường do API (cổng 3001) chưa chạy. Chạy <code className="rounded bg-white px-1">npm run dev:api</code>{' '}
            rồi tải lại trang.
          </p>
        ) : null}
        <Link href="/documents" className="orc-btn orc-btn-primary !text-[12px]">
          Về danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#f3f2f1] text-[#323130]">
      <header className="flex flex-wrap items-center gap-3 border-b border-[#edebe9] bg-white px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#0078d4] uppercase">
            Trợ lý công văn · Bàn làm việc
          </p>
          <h1 className="truncate text-base font-semibold">{session.doc.originalFilename}</h1>
          <p className="text-[11px] text-[#605e5c]">
            Đề xuất → đối chiếu → Nhận / Sửa / ✕ → Lưu kiến thức
          </p>
        </div>
        <Link href="/documents" className="orc-btn !text-[11px]">
          Tài liệu khác
        </Link>
        <Link
          href={`/workspace/${documentId}?lab=1`}
          className="text-[10px] text-[#a19f9d] underline-offset-2 hover:underline"
        >
          Lab
        </Link>
      </header>

      {phase === 'summary' ? (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-auto px-4 py-6">
          <h2 className="text-xl font-semibold">Tóm tắt kiến thức sẽ lưu</h2>
          <p className="text-[13px] text-[#605e5c]">
            Chỉ mục đã Nhận được ghi khi Lưu. Bỏ qua không vào thư viện.
          </p>
          <ul className="space-y-2">
            {steps.map((s, i) => (
              <li key={s.nodeId} className="rounded border border-[#edebe9] bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-[10px] uppercase text-[#605e5c]">
                    {s.outcome === 'accepted'
                      ? 'Nhận'
                      : s.outcome === 'skipped'
                        ? 'Bỏ qua'
                        : 'Chưa duyệt'}
                  </span>
                </div>
                {s.outcome === 'accepted' ? (
                  <p className="mt-1 text-[13px] leading-snug">{s.draft}</p>
                ) : null}
                {s.outcome === 'pending' ? (
                  <button
                    type="button"
                    className="mt-1 text-[11px] text-[#0078d4] underline"
                    onClick={() => {
                      setIndex(i);
                      setPhase('review');
                    }}
                  >
                    Duyệt mục này
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="orc-btn orc-btn-primary !px-4 !py-2"
              disabled={session.saving || acceptedCount === 0}
              onClick={() => void onSave()}
            >
              {session.saving ? 'Đang lưu…' : `Lưu kiến thức (${acceptedCount})`}
            </button>
            <button
              type="button"
              className="orc-btn !px-4 !py-2"
              onClick={() => {
                const p = steps.findIndex((s) => s.outcome === 'pending');
                setIndex(p >= 0 ? p : 0);
                setPhase('review');
              }}
            >
              Quay lại duyệt
            </button>
          </div>
          {session.status ? (
            <p className="text-[12px] text-[#605e5c]">{session.status}</p>
          ) : null}
          {session.error ? (
            <p className="text-[12px] text-[#a4262c]">{session.error}</p>
          ) : null}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section className="flex w-full min-h-0 flex-col border-b border-[#edebe9] bg-white lg:w-[42%] lg:border-r lg:border-b-0">
            <div className="flex shrink-0 gap-1 border-b border-[#edebe9] px-2 py-1">
              <button
                type="button"
                className={`orc-btn flex-1 !py-1 !text-[11px] ${deskTab === 'layers' ? 'orc-btn-primary' : ''}`}
                onClick={() => setDeskTab('layers')}
              >
                Kiểm tra lớp ({layoutLayers.length})
              </button>
              <button
                type="button"
                className={`orc-btn flex-1 !py-1 !text-[11px] ${deskTab === 'fields' ? 'orc-btn-primary' : ''}`}
                onClick={() => setDeskTab('fields')}
              >
                Duyệt trường ({index + 1}/{steps.length})
              </button>
            </div>

            {deskTab === 'layers' ? (
              <div className="min-h-0 flex-1 overflow-auto">
                <DeskLayerInspector
                  layers={layoutLayers}
                  dispositions={layerDispositions}
                  focusedLayerId={focusedLayerId}
                  isolating={isolating}
                  onDisposition={onLayerDisposition}
                  onSelectLayer={onSelectLayer}
                  onFitLayer={onFitLayer}
                  onClearIsolate={onClearIsolate}
                  onKeepAllContent={onKeepAllContent}
                  onDiscardChrome={onDiscardChrome}
                />
                <div className="px-3 py-2 text-[11px] leading-snug text-[#605e5c]">
                  Click lớp → chỉ hiện lớp đó + Fit vùng. Nút Ẩn → gác khỏi mặt đọc. «Bỏ chỉ lớp»
                  hiện lại các lớp đang đọc. Evidence gốc không đổi.
                </div>
              </div>
            ) : (
              <>
            <div className="border-b border-[#edebe9] px-4 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-wide text-[#605e5c] uppercase">
                  Bước {index + 1} / {steps.length}
                </p>
                <p className="text-[10px] text-[#605e5c]">
                  Còn {pendingCount} · Nhận {acceptedCount} · Bỏ {skippedCount}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {steps.map((s, i) => (
                  <button
                    key={s.nodeId}
                    type="button"
                    title={s.label}
                    onClick={() => setIndex(i)}
                    className={`h-2 w-6 rounded-sm ${
                      i === index
                        ? 'bg-[#0078d4]'
                        : s.outcome === 'accepted'
                          ? 'bg-[#107c10]'
                          : s.outcome === 'skipped'
                            ? 'bg-[#a19f9d]'
                            : 'bg-[#edebe9]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
              {readingHint ? (
                <p className="mb-3 rounded border border-[#edebe9] bg-[#faf9f8] px-3 py-2 text-[12px] text-[#605e5c]">
                  Đang đọc chữ từ bằng chứng… đề xuất sẽ hiện khi có dữ liệu.
                </p>
              ) : null}

              {current ? (
                <>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold">{current.label}</h2>
                      {current.reason ? (
                        <p className="mt-0.5 text-[11px] text-[#605e5c]">{current.reason}</p>
                      ) : (
                        <p className="mt-0.5 text-[11px] italic text-[#a19f9d]">
                          Chưa có đề xuất — gõ tay hoặc ✕ bỏ qua
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="orc-btn shrink-0 !px-2 !py-1 !text-sm font-bold text-[#a4262c]"
                      title="Bỏ qua"
                      onClick={onSkip}
                    >
                      ✕
                    </button>
                  </div>

                  {textStatus === 'empty' ? (
                    <p className="mb-3 rounded border border-[#fce100] bg-[#fff4ce] px-3 py-2 text-[12px]">
                      Không đọc được chữ trên trang này. Gõ tay hoặc ✕ — không đoán giúp bạn.
                    </p>
                  ) : null}

                  <label className="block text-[11px] font-semibold text-[#605e5c]">
                    Nội dung sẽ ghi (sửa trước khi Nhận)
                    <textarea
                      className="mt-1 min-h-[120px] w-full resize-y rounded border border-[#8a8886] bg-[#faf9f8] px-3 py-2 text-sm leading-relaxed outline-none focus:border-[#0078d4]"
                      value={current.draft}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSteps((prev) =>
                          prev.map((s, i) => (i === index ? { ...s, draft: v } : s)),
                        );
                      }}
                      placeholder="Gõ hoặc sửa đề xuất…"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="orc-btn orc-btn-primary !px-4 !py-2 !text-sm"
                      onClick={onAccept}
                      disabled={!current.draft.trim()}
                    >
                      Nhận
                    </button>
                    <button type="button" className="orc-btn !px-4 !py-2 !text-sm" onClick={onSkip}>
                      Bỏ qua (X)
                    </button>
                    <button
                      type="button"
                      className="orc-btn !px-3 !py-2 !text-sm"
                      onClick={() => setPhase('summary')}
                    >
                      Xem tóm tắt
                    </button>
                  </div>
                </>
              ) : null}
            </div>
              </>
            )}
          </section>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#e1dfdd]">
            <div className="shrink-0 border-b border-[#c8c6c4] bg-[#f3f2f1] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-[#605e5c] uppercase">
              Đối chiếu · trang {current?.pageNumber ?? 1}
              <span className="ml-2 font-normal normal-case text-[#a19f9d]">
                (bật/tắt lớp ở tab Kiểm tra lớp)
              </span>
            </div>
            <div className="min-h-0 flex-1">
              {isPdf ? (
                <PdfViewer
                  fileUrl={documentFileUrl(documentId)}
                  highlights={[]}
                  activePenColor={null}
                  flashNodeId={null}
                  requestPage={requestPage}
                  requestFocusRegion={focusRegionReq}
                  modulePresentation={deskPresentation}
                  contentOnlyVisual={deskContentOnly}
                  canvasOnlyVisual={false}
                  visualPeelMode={deskContentOnly ? 'cover' : 'fade'}
                  untaggedTextVisible={untaggedTextVisible}
                  onPageChange={onEvidencePageChange}
                  onPageText={onPageText}
                  onTextStatus={onTextStatusStable}
                  onStructureAnalyzed={onStructureAnalyzed}
                  onPenStroke={() => undefined}
                  onTextSelected={() => undefined}
                  onHighlightClick={() => undefined}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-sm text-[#605e5c]">
                  Chỉ PDF hỗ trợ đối chiếu trên bàn này.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
