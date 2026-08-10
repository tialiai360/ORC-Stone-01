'use client';

import { ReviewExportButton } from '../../review';

type WorkspaceHeaderProps = {
  filename: string;
  version: number;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  saving: boolean;
  exporting: boolean;
  /** User Work Desk vs developer chrome. */
  workDesk?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
};

export function WorkspaceHeader({
  filename,
  version,
  dirty,
  canUndo,
  canRedo,
  saving,
  exporting,
  workDesk = false,
  onUndo,
  onRedo,
  onSave,
  onExport,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-3 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] tracking-wide text-[var(--muted)] uppercase">
          {workDesk
            ? 'Stone-01 · Bàn làm việc — việc gì tiếp theo?'
            : 'Stone-01 · Trợ lý Thông báo HO'}
        </p>
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="truncate text-sm font-semibold">{filename}</h1>
          <span className="shrink-0 text-[11px] text-[var(--muted)]">v{version}</span>
          {dirty ? (
            <span className="shrink-0 text-[11px] text-[var(--accent)]">chưa lưu</span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className="orc-btn" disabled={!canUndo} onClick={onUndo}>
          Hoàn tác
        </button>
        <button type="button" className="orc-btn" disabled={!canRedo} onClick={onRedo}>
          Làm lại
        </button>
        <button
          type="button"
          className="orc-btn orc-btn-primary"
          disabled={saving || !dirty}
          onClick={onSave}
        >
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
        <ReviewExportButton exporting={exporting} onExport={onExport} />
        <a href="/documents" className="orc-btn">
          Danh sách
        </a>
      </div>
    </header>
  );
}
