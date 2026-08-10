'use client';

import { SHORTCUT_PEN_NODES } from '@orc/shared';

type FloatingHintProps = {
  open: boolean;
  x: number;
  y: number;
  selectedText: string;
  onAssign: (nodeId: string) => void;
  onClose: () => void;
};

/** Compact floating pens after text selection — no dialog. */
export function FloatingHint({
  open,
  x,
  y,
  selectedText,
  onAssign,
  onClose,
}: FloatingHintProps) {
  if (!open || !selectedText.trim()) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        aria-label="Đóng gợi ý"
        onClick={onClose}
      />
      <div
        className="fixed z-50 flex max-w-[300px] flex-wrap gap-1 rounded border border-[var(--border-strong)] bg-white p-1.5 shadow-md"
        style={{
          left: Math.min(x, typeof window !== 'undefined' ? window.innerWidth - 320 : x),
          top: Math.min(y + 8, typeof window !== 'undefined' ? window.innerHeight - 100 : y),
        }}
      >
        {SHORTCUT_PEN_NODES.map((n) => (
          <button
            key={n.id}
            type="button"
            title={`${n.label} (Ctrl+${n.shortcutDigit})`}
            className="orc-chip !border-[#edebe9] hover:bg-[var(--bg)]"
            onClick={() => onAssign(n.id)}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: n.color }}
            />
            <span className="font-mono">{n.shortcutDigit}</span>
          </button>
        ))}
      </div>
    </>
  );
}
