'use client';

import { useEffect, useMemo, useState } from 'react';
import type { OutlineEntry } from '../dpk/legal-structure';
import type { DetectedModule } from '../pdf/plugins/types';
import type { PdfBookmarkEntry } from '../pdf/pdf-bookmarks';
import type { NavLocation } from './use-nav-history';

type Props = {
  numPages: number;
  currentPage: number;
  /** Legal Điều/Khoản… when detected */
  outline: OutlineEntry[];
  /** Structure layers with regions — primary useful nav */
  layers?: DetectedModule[];
  /** Currently revealed layer from left nav (highlight only). */
  selectedLayerId?: string | null;
  bookmarks?: PdfBookmarkEntry[];
  recent: NavLocation[];
  onGoPage: (page: number) => void;
  onGoOutline: (entry: OutlineEntry) => void;
  onGoBookmark?: (entry: PdfBookmarkEntry) => void;
  /** Jump to layer on PDF (page + highlight/isolate optional). */
  onGoLayer?: (module: DetectedModule) => void;
  onGoRecent: (loc: NavLocation) => void;
  /** User audience: pages + outline only — hide technical layer list. */
  simpleNav?: boolean;
};

const KIND_LABEL: Record<string, string> = {
  page: 'Trang',
  article: 'Điều',
  clause: 'Khoản',
  point: 'Điểm',
  subject: 'Trích yếu',
  'legal-basis': 'Căn cứ',
};

/**
 * Left nav — điều hướng tài liệu (trang · lớp · mục lục).
 * Chỉ hiện mục có dữ liệu; lớp cấu trúc phải có vùng mới điều hướng được.
 */
export function DocumentOutline({
  numPages,
  currentPage,
  outline,
  layers = [],
  selectedLayerId = null,
  bookmarks = [],
  recent,
  onGoPage,
  onGoOutline,
  onGoBookmark,
  onGoLayer,
  onGoRecent,
  simpleNav = false,
}: Props) {
  const [jump, setJump] = useState(String(currentPage || 1));

  useEffect(() => {
    setJump(String(currentPage || 1));
  }, [currentPage]);

  const actionableLayers = useMemo(
    () => layers.filter((m) => m.actionable && m.pageNumbers.length > 0),
    [layers],
  );

  const pageList = useMemo(() => {
    const total = Math.max(numPages, 0);
    if (total === 0) {
      return [] as number[];
    }
    // Compact window around current for long docs; full list if short
    if (total <= 40) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const start = Math.max(1, currentPage - 10);
    const end = Math.min(total, currentPage + 10);
    const out: number[] = [];
    for (let p = start; p <= end; p += 1) {
      out.push(p);
    }
    return out;
  }, [currentPage, numPages]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--panel)]">
      <div className="border-b border-[var(--border)] px-3 py-1.5">
        <h2 className="text-sm font-semibold text-[var(--fg)]">
          {simpleNav ? 'Trang' : 'Điều hướng'}
        </h2>
        <p className="text-[10px] text-[var(--muted)]">
          {simpleNav
            ? `Trang ${currentPage || '—'}${numPages ? ` / ${numPages}` : ''} · bấm để đổi trang`
            : `Trang ${currentPage || '—'}${numPages ? ` / ${numPages}` : ''} · bấm để nhảy trên PDF`}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto text-[11px]">
        {/* —— Pages (always primary) —— */}
        <section className="border-b border-[var(--border)] px-2 py-1.5">
          <p className="mb-1 px-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            Trang
          </p>
          <form
            className="mb-1.5 flex items-center gap-1 px-1"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number.parseInt(jump, 10);
              if (Number.isFinite(n) && n >= 1) {
                onGoPage(n);
              }
            }}
          >
            <input
              className="w-12 rounded border border-[var(--border)] px-1 py-0.5 text-center tabular-nums"
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              onBlur={() => setJump(String(currentPage || 1))}
              aria-label="Số trang"
              inputMode="numeric"
            />
            <button type="submit" className="orc-btn !px-1.5 !py-0.5 !text-[10px]">
              Tới
            </button>
            <button
              type="button"
              className="orc-btn !px-1.5 !py-0.5 !text-[10px]"
              disabled={currentPage <= 1}
              onClick={() => onGoPage(currentPage - 1)}
              title="Trang trước"
            >
              ←
            </button>
            <button
              type="button"
              className="orc-btn !px-1.5 !py-0.5 !text-[10px]"
              disabled={!numPages || currentPage >= numPages}
              onClick={() => onGoPage(currentPage + 1)}
              title="Trang sau"
            >
              →
            </button>
          </form>
          {numPages === 0 ? (
            <p className="px-1 text-[var(--muted)]">Chưa mở PDF</p>
          ) : (
            <ul className="grid grid-cols-5 gap-0.5">
              {pageList.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    className={`orc-btn w-full !px-0 !py-1 !text-[11px] tabular-nums ${
                      p === currentPage ? 'orc-btn-primary' : ''
                    }`}
                    onClick={() => onGoPage(p)}
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {numPages > 40 ? (
            <p className="mt-1 px-1 text-[10px] text-[var(--muted)]">
              Hiển thị quanh trang hiện tại — nhập số để nhảy xa
            </p>
          ) : null}
        </section>

        {/* —— Structure layers (developer / full nav) —— */}
        {!simpleNav ? (
        <section className="border-b border-[var(--border)] px-2 py-1.5">
          <p className="mb-1 px-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            Lớp trên PDF
          </p>
          <p className="mb-1 px-1 text-[10px] text-[var(--muted)]">
            Bấm = tới trang + tô lớp (không ẩn lớp khác)
          </p>
          {actionableLayers.length === 0 ? (
            <p className="px-1 text-[var(--muted)]">
              Chưa có lớp có vùng — mở/đổi trang để phân tích.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {actionableLayers.map((m) => {
                const selected = selectedLayerId === m.moduleId;
                return (
                  <li key={m.moduleId}>
                    <button
                      type="button"
                      className={`w-full rounded px-1.5 py-1 text-left hover:bg-[var(--bg)] ${
                        selected ? 'bg-[#deecf9] ring-1 ring-[var(--accent)]' : ''
                      }`}
                      title={`Tới «${m.labelVi}» và tô trên PDF`}
                      onClick={() => onGoLayer?.(m)}
                    >
                      <span className="font-medium text-[var(--fg)]">{m.labelVi}</span>
                      <span className="ml-1 text-[var(--muted)]">
                        {m.regionCount} vùng · p.{m.pageNumbers.slice(0, 4).join(',')}
                        {m.pageNumbers.length > 4 ? '…' : ''}
                      </span>
                      {m.sampleText ? (
                        <span className="mt-0.5 block line-clamp-2 text-[10px] text-[var(--muted)]">
                          {m.sampleText}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        ) : null}

        {/* —— Legal outline —— */}
        {outline.length > 0 ? (
          <section className="border-b border-[var(--border)] px-2 py-1.5">
            <p className="mb-1 px-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Điều / Khoản
            </p>
            <ul className="space-y-0.5">
              {outline.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className={`w-full rounded px-1.5 py-1 text-left hover:bg-[var(--bg)] ${
                      e.pageNumber === currentPage ? 'bg-[#deecf9]/60' : ''
                    }`}
                    onClick={() => onGoOutline(e)}
                    title={e.text}
                  >
                    <span className="font-medium text-[var(--fg)]">
                      {KIND_LABEL[e.kind] ?? e.label}
                    </span>
                    <span className="ml-1 text-[var(--muted)]">p.{e.pageNumber}</span>
                    <span className="mt-0.5 block line-clamp-2 text-[10px] text-[var(--muted)]">
                      {e.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* —— PDF bookmarks —— */}
        {bookmarks.length > 0 ? (
          <section className="border-b border-[var(--border)] px-2 py-1.5">
            <p className="mb-1 px-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Bookmarks file
            </p>
            <ul className="space-y-0.5">
              {bookmarks.slice(0, 80).map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="w-full rounded px-1.5 py-1 text-left hover:bg-[var(--bg)]"
                    style={{ paddingLeft: `${6 + b.level * 10}px` }}
                    onClick={() => onGoBookmark?.(b)}
                    title={b.title}
                  >
                    <span className="font-medium text-[var(--fg)]">{b.title}</span>
                    <span className="ml-1 text-[var(--muted)]">p.{b.pageNumber}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* —— Recent —— */}
        {recent.length > 0 ? (
          <section className="px-2 py-1.5">
            <p className="mb-1 px-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Gần đây
            </p>
            <ul className="space-y-0.5">
              {recent.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="w-full rounded px-1.5 py-1 text-left hover:bg-[var(--bg)]"
                    onClick={() => onGoRecent(r)}
                  >
                    <span className="text-[var(--fg)]">{r.label}</span>
                    {r.pageNumber ? (
                      <span className="ml-1 text-[var(--muted)]">p.{r.pageNumber}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
