'use client';

import { SHORTCUT_PEN_NODES } from '@orc/shared';

type PenToolbarProps = {
  activeNodeId: string | null;
  onSelectPen: (nodeId: string | null) => void;
  /** Focus / compact: color swatches only, labels on hover. */
  compact?: boolean;
};

export function PenToolbar({ activeNodeId, onSelectPen, compact = false }: PenToolbarProps) {
  return (
    <div
      className={`flex items-center gap-2 border-b border-[var(--border)] bg-[var(--panel-soft)] px-3 ${
        compact ? 'py-0.5' : 'py-1'
      }`}
    >
      {!compact ? (
        <span className="shrink-0 text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
          Bút tô
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-0.5 [scrollbar-width:thin]">
        {SHORTCUT_PEN_NODES.map((node) => {
          const active = activeNodeId === node.id;
          return (
            <button
              key={node.id}
              type="button"
              title={`${node.label} (Ctrl+${node.shortcutDigit})`}
              onClick={() => onSelectPen(active ? null : node.id)}
              className={compact ? 'orc-btn !px-1.5 !py-1' : 'orc-chip shrink-0'}
              data-active={active ? 'true' : 'false'}
              style={{ backgroundColor: active ? `${node.color}33` : '#fff' }}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: node.color }}
              />
              {!compact ? (
                <>
                  <span>{node.label}</span>
                  <kbd className="rounded bg-[#edebe9] px-1 font-mono text-[10px] text-[var(--muted)]">
                    {node.shortcutDigit}
                  </kbd>
                </>
              ) : (
                <kbd className="font-mono text-[10px] text-[var(--muted)]">{node.shortcutDigit}</kbd>
              )}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="orc-btn shrink-0 !px-2 !py-1 !text-[11px]"
        onClick={() => onSelectPen(null)}
        title="Hủy bút (Esc)"
      >
        Esc
      </button>
    </div>
  );
}
