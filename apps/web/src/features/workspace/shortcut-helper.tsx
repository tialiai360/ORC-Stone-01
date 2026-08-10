'use client';

import { useEffect, useState } from 'react';
import { SHORTCUT_PEN_NODES } from '@orc/shared';

export type ShortcutHelperMode = 'full' | 'compact' | 'hidden';

type ShortcutHelperProps = {
  mode: ShortcutHelperMode;
  forceShow: boolean;
  onDismissForce: () => void;
  /** After first assign, stay collapsed unless user opens chip / `?`. */
  usedOnce?: boolean;
};

/**
 * P0.6 Instruction overlay — collapsed chip by default; expand on hover/click.
 * Corner-only; does not cover the PDF annotation surface.
 */
export function ShortcutHelper({
  mode,
  forceShow,
  onDismissForce,
  usedOnce = false,
}: ShortcutHelperProps) {
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setExpanded(true);
      setPinned(true);
    }
  }, [forceShow]);

  useEffect(() => {
    if (usedOnce && !forceShow && !pinned) {
      setExpanded(false);
    }
  }, [usedOnce, forceShow, pinned]);

  const panelOpen = forceShow || expanded;
  const displayMode: ShortcutHelperMode =
    forceShow || mode === 'full' ? 'full' : mode === 'hidden' ? 'compact' : mode;

  function dismiss() {
    if (forceShow) {
      onDismissForce();
    }
    setExpanded(false);
    setPinned(false);
  }

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-30 flex max-w-[16.5rem] flex-col items-start gap-1">
      <button
        type="button"
        className="orc-btn pointer-events-auto !px-2 !py-1 !text-[11px] shadow-sm"
        title="Hướng dẫn phím tắt (? để ghim)"
        aria-expanded={panelOpen}
        aria-controls="orc-shortcut-panel"
        onClick={() => {
          if (panelOpen) {
            dismiss();
          } else {
            setPinned(true);
            setExpanded(true);
          }
        }}
        onMouseEnter={() => setExpanded(true)}
        onFocus={() => setExpanded(true)}
      >
        Phím tắt
        <kbd className="rounded bg-[#edebe9] px-1 font-mono text-[10px] text-[var(--muted)]">?</kbd>
      </button>

      {panelOpen ? (
        <div
          id="orc-shortcut-panel"
          className="pointer-events-auto rounded border border-[var(--border)] bg-white/96 p-2.5 text-[11px] shadow-md backdrop-blur-sm"
          onMouseLeave={() => {
            if (!pinned && !forceShow) {
              setExpanded(false);
            }
          }}
        >
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="font-semibold text-[var(--fg)]">Phím tắt</p>
            <button type="button" className="text-[var(--accent)] hover:underline" onClick={dismiss}>
              Ẩn
            </button>
          </div>
          <p className="mb-1 text-[10px] font-semibold text-[var(--muted)] uppercase">Bút tô</p>
          {displayMode === 'full' ? (
            <ul className="space-y-0.5 text-[var(--fg)]">
              {SHORTCUT_PEN_NODES.map((n) => (
                <li key={n.id} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: n.color }}
                  />
                  <span>
                    <kbd className="font-mono text-[var(--muted)]">Ctrl+{n.shortcutDigit}</kbd>{' '}
                    {n.label}
                  </span>
                </li>
              ))}
              <li className="pt-1 text-[var(--muted)]">Esc — hủy bút · ? — hiện hướng dẫn</li>
              <li className="pt-1.5 text-[10px] font-semibold text-[var(--muted)] uppercase">
                Workbench
              </li>
              <li className="text-[var(--muted)]">Alt+[ / ] — Mục lục / Kiến thức</li>
              <li className="text-[var(--muted)]">Alt+E — Bằng chứng · Alt+F — Focus</li>
              <li className="text-[var(--muted)]">PageUp / PageDown — đổi trang</li>
            </ul>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {SHORTCUT_PEN_NODES.map((n) => (
                <span key={n.id} className="inline-flex items-center gap-1">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: n.color }}
                  />
                  <span className="font-mono font-medium text-[var(--fg)]">{n.shortcutDigit}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
