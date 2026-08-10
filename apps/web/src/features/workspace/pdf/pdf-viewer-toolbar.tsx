'use client';

import type { RefObject } from 'react';

export type PdfScrollMode = 'single' | 'continuous';

type Props = {
  pageNumber: number;
  numPages: number;
  scale: number;
  scrollMode: PdfScrollMode;
  activePenColor: string | null;
  textStatus: 'unknown' | 'ready' | 'empty';
  onPrev: () => void;
  onNext: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitWidth: () => void;
  onToggleScrollMode: () => void;
  pageInput: string;
  onPageInputChange: (v: string) => void;
  onPageInputCommit: () => void;
  /** In-document find (Ctrl+F) — TextLayer only. */
  findOpen?: boolean;
  findQuery?: string;
  findIndex?: number;
  findTotal?: number;
  onToggleFind?: () => void;
  onFindQueryChange?: (v: string) => void;
  onFindPrev?: () => void;
  onFindNext?: () => void;
  findInputRef?: RefObject<HTMLInputElement | null>;
};

export function PdfViewerToolbar({
  pageNumber,
  numPages,
  scale,
  scrollMode,
  activePenColor,
  textStatus,
  onPrev,
  onNext,
  onZoomOut,
  onZoomIn,
  onFitWidth,
  onToggleScrollMode,
  pageInput,
  onPageInputChange,
  onPageInputCommit,
  findOpen = false,
  findQuery = '',
  findIndex = 0,
  findTotal = 0,
  onToggleFind,
  onFindQueryChange,
  onFindPrev,
  onFindNext,
  findInputRef,
}: Props) {
  return (
    <div className="flex flex-col border-b border-[var(--border)] bg-[var(--panel)] text-[12px] text-[var(--fg)]">
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1">
        <button
          type="button"
          className="orc-btn !px-2 !py-0.5"
          disabled={pageNumber <= 1}
          onClick={onPrev}
          title="Trang trước (PageUp)"
        >
          ←
        </button>
        <form
          className="inline-flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            onPageInputCommit();
          }}
        >
          <input
            className="w-10 rounded border border-[var(--border)] bg-white px-1 py-0.5 text-center tabular-nums"
            value={pageInput}
            onChange={(e) => onPageInputChange(e.target.value)}
            onBlur={onPageInputCommit}
            aria-label="Số trang"
            inputMode="numeric"
          />
          <span className="tabular-nums text-[var(--muted)]">/ {numPages || '—'}</span>
        </form>
        <button
          type="button"
          className="orc-btn !px-2 !py-0.5"
          disabled={!numPages || pageNumber >= numPages}
          onClick={onNext}
          title="Trang sau (PageDown)"
        >
          →
        </button>
        <span className="mx-1 h-3.5 w-px bg-[var(--border)]" />
        <button type="button" className="orc-btn !px-2 !py-0.5" onClick={onZoomOut} title="Thu nhỏ">
          −
        </button>
        <span className="min-w-[3rem] text-center tabular-nums">{Math.round(scale * 100)}%</span>
        <button type="button" className="orc-btn !px-2 !py-0.5" onClick={onZoomIn} title="Phóng to">
          +
        </button>
        <button
          type="button"
          className="orc-btn !px-2 !py-0.5 !text-[11px]"
          onClick={onFitWidth}
          title="Vừa khung ngang"
        >
          Vừa khung
        </button>
        <button
          type="button"
          className={`orc-btn !px-2 !py-0.5 !text-[11px] ${
            scrollMode === 'continuous' ? 'orc-btn-primary' : ''
          }`}
          aria-pressed={scrollMode === 'continuous'}
          onClick={onToggleScrollMode}
          title="Cuộn liên tục: hiện trang trước/sau (±1)"
        >
          {scrollMode === 'continuous' ? 'Cuộn ±1' : '1 trang'}
        </button>
        {onToggleFind ? (
          <button
            type="button"
            className={`orc-btn !px-2 !py-0.5 !text-[11px] ${findOpen ? 'orc-btn-primary' : ''}`}
            aria-pressed={findOpen}
            onClick={onToggleFind}
            title="Tìm trong tài liệu (Ctrl+F) — theo chữ đã trích từ provider"
          >
            Tìm
          </button>
        ) : null}
        {activePenColor ? (
          <span className="ml-1 inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
            Đang tô
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: activePenColor }}
            />
          </span>
        ) : null}
        {textStatus === 'ready' ? (
          <span className="ml-auto text-[11px] text-[var(--muted)]">Chữ chọn được</span>
        ) : null}
      </div>
      {findOpen ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--border)] px-2.5 py-1">
          <input
            ref={findInputRef}
            className="min-w-[10rem] flex-1 rounded border border-[var(--border)] bg-white px-2 py-0.5"
            value={findQuery}
            onChange={(e) => onFindQueryChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                  onFindPrev?.();
                } else {
                  onFindNext?.();
                }
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                onToggleFind?.();
              }
            }}
            placeholder="Tìm trong PDF (lớp chữ)…"
            aria-label="Tìm trong PDF"
          />
          <span className="tabular-nums text-[11px] text-[var(--muted)]">
            {findTotal > 0 ? `${findIndex + 1}/${findTotal}` : findQuery.trim() ? '0' : '—'}
          </span>
          <button
            type="button"
            className="orc-btn !px-2 !py-0.5"
            onClick={onFindPrev}
            disabled={findTotal === 0}
            title="Kết quả trước (Shift+Enter)"
          >
            ↑
          </button>
          <button
            type="button"
            className="orc-btn !px-2 !py-0.5"
            onClick={onFindNext}
            disabled={findTotal === 0}
            title="Kết quả sau (Enter)"
          >
            ↓
          </button>
        </div>
      ) : null}
    </div>
  );
}
