'use client';

type WorkspaceStatusBarProps = {
  status: string;
  error: string | null;
  /** End-user guidance (replaces shortcut dump). */
  guideHint?: string;
};

export function WorkspaceStatusBar({ status, error, guideHint }: WorkspaceStatusBarProps) {
  return (
    <div className="flex items-center gap-3 border-b border-[#edebe9] bg-[var(--panel-soft)] px-3 py-1 text-[11px] text-[var(--muted)]">
      <span className="min-w-0 truncate font-medium text-[var(--fg)]">{status}</span>
      <span className="hidden truncate sm:inline">
        {guideHint ?? 'Chọn chữ để tô · Ctrl+số · Esc · phím tắt góc trái'}
      </span>
      {error ? <span className="shrink-0 text-[var(--danger)]">{error}</span> : null}
    </div>
  );
}
