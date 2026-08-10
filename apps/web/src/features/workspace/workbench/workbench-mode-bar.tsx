'use client';

import type { PageDiagnostics } from '../pdf/types';
import type { WorkspaceViewMode } from '../pdf/plugins/types';
import { AUDIENCE_LABELS, type WorkbenchAudience } from './audience';
import { WORKBENCH_MODES } from './modes';

/** Modes shown to end users — avoid authoring/review/focus overload. */
const USER_MODES: WorkspaceViewMode[] = ['reading', 'normal'];

type Props = {
  audience: WorkbenchAudience;
  onAudienceChange: (a: WorkbenchAudience) => void;
  mode: WorkspaceViewMode;
  onModeChange: (mode: WorkspaceViewMode) => void;
  leftOpen: boolean;
  rightOpen: boolean;
  evidenceOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleEvidence: () => void;
  diagnostics: PageDiagnostics | null;
  diagOpen: boolean;
  onToggleDiag: () => void;
};

export function WorkbenchModeBar({
  audience,
  onAudienceChange,
  mode,
  onModeChange,
  leftOpen,
  rightOpen,
  evidenceOpen,
  onToggleLeft,
  onToggleRight,
  onToggleEvidence,
  diagnostics,
  diagOpen,
  onToggleDiag,
}: Props) {
  const coverage = diagnostics?.selectableCoverage;
  const ro = diagnostics?.readingOrderConfidence;
  const isDev = audience === 'developer';
  const modes = isDev
    ? WORKBENCH_MODES
    : WORKBENCH_MODES.filter((m) => USER_MODES.includes(m.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border)] bg-[var(--panel-soft)] px-2.5 py-1">
      <div
        className="flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--panel)] p-0.5"
        role="group"
        aria-label="Đối tượng sử dụng"
      >
        {(['user', 'developer'] as const).map((a) => (
          <button
            key={a}
            type="button"
            title={AUDIENCE_LABELS[a].title}
            aria-pressed={audience === a}
            className={`orc-btn !px-2 !py-0.5 !text-[11px] ${
              audience === a ? 'orc-btn-primary' : '!border-transparent'
            }`}
            onClick={() => onAudienceChange(a)}
          >
            {AUDIENCE_LABELS[a].label}
          </button>
        ))}
      </div>

      <span className="mx-0.5 hidden h-3.5 w-px bg-[var(--border)] sm:inline-block" />

      <span className="mr-0.5 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
        {isDev ? 'Không gian' : 'Xem'}
      </span>
      <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Chế độ xem">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.title}
            aria-pressed={mode === m.id}
            className={`orc-btn !px-2 !py-0.5 !text-[11px] ${mode === m.id ? 'orc-btn-primary' : ''}`}
            onClick={() => onModeChange(m.id)}
          >
            {isDev ? m.label : m.id === 'reading' ? 'Chỉ nội dung' : 'Hiện đủ lớp'}
          </button>
        ))}
      </div>

      <span className="mx-1 hidden h-3.5 w-px bg-[var(--border)] sm:inline-block" />

      <button
        type="button"
        className={`orc-btn !px-2 !py-0.5 !text-[11px] ${leftOpen ? '' : 'opacity-70'}`}
        aria-pressed={leftOpen}
        onClick={onToggleLeft}
        title="Hiện/ẩn thanh Điều hướng trái (Alt+[)"
      >
        {isDev ? 'Điều hướng' : 'Trang'}
      </button>
      <button
        type="button"
        className={`orc-btn !px-2 !py-0.5 !text-[11px] ${
          rightOpen ? 'orc-btn-primary' : isDev ? 'opacity-70' : 'orc-btn-primary'
        }`}
        aria-pressed={rightOpen}
        onClick={onToggleRight}
        title={isDev ? 'Hiện/ẩn Kiến thức (Alt+])' : 'Hiện/ẩn Bằng chứng PDF (Alt+])'}
      >
        {isDev ? 'Kiến thức' : rightOpen ? 'Ẩn bằng chứng' : 'Mở bằng chứng (PDF)'}
      </button>
      {!isDev ? (
        <span className="rounded border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--fg)]">
          Bàn làm việc · PDF không còn trung tâm
        </span>
      ) : null}
      {isDev ? (
        <button
          type="button"
          className={`orc-btn !px-2 !py-0.5 !text-[11px] ${evidenceOpen ? '' : 'opacity-70'}`}
          aria-pressed={evidenceOpen}
          onClick={onToggleEvidence}
          title="Hiện/ẩn Bằng chứng (Alt+E)"
        >
          Chuỗi Evidence
        </button>
      ) : null}

      {isDev ? (
        <button
          type="button"
          className={`orc-btn ml-auto !px-2 !py-0.5 !text-[10px] font-mono ${
            diagOpen ? 'orc-btn-primary' : ''
          }`}
          aria-pressed={diagOpen}
          onClick={onToggleDiag}
          title="Chẩn đoán cấu trúc trang"
        >
          {diagnostics ? `Diag ${coverage ?? '—'}% · RO ${ro ?? '—'}` : 'Diag'}
        </button>
      ) : (
        <span className="ml-auto rounded bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--fg)] lg:inline">
          Đang xem Bàn làm việc (không phải lab PDF)
        </span>
      )}
    </div>
  );
}
