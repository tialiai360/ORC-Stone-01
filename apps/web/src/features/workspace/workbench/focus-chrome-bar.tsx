'use client';

type Props = {
  filename: string;
  dirty: boolean;
  saving: boolean;
  onExitFocus: () => void;
  onSave: () => void;
};

/** Compact chrome when Workbench Focus mode is active. */
export function FocusChromeBar({
  filename,
  dirty,
  saving,
  onExitFocus,
  onSave,
}: Props) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-[11px]">
      <span className="truncate font-semibold">{filename}</span>
      {dirty ? <span className="text-[var(--accent)]">chưa lưu</span> : null}
      <button
        type="button"
        className="orc-btn ml-auto !px-2 !py-0.5 !text-[11px]"
        onClick={onExitFocus}
      >
        Thoát Focus
      </button>
      <button
        type="button"
        className="orc-btn orc-btn-primary !px-2 !py-0.5 !text-[11px]"
        disabled={saving || !dirty}
        onClick={onSave}
      >
        Lưu
      </button>
    </div>
  );
}
