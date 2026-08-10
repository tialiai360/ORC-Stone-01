'use client';

import { dpkLabelForStone } from '../dpk/module-map';
import type { DetectedModule, StructureModuleId, WorkspaceViewMode } from '../pdf/plugins/types';
import type { ModulePresentationMap } from '../hooks/use-structure-presentation';
import { WORKBENCH_MODES } from '../workbench/modes';

type Props = {
  detected: DetectedModule[];
  presentation: Partial<ModulePresentationMap>;
  mode: WorkspaceViewMode;
  isolatedId?: StructureModuleId | null;
  onModeChange: (mode: WorkspaceViewMode) => void;
  /** Checkbox: ONLY show/hide */
  onToggleVisible: (id: StructureModuleId) => void;
  /** Button Tô: ONLY highlight frame on/off */
  onToggleHighlight: (id: StructureModuleId) => void;
  /** Button Tới: navigate to page + locate (highlight) region */
  onLocate: (id: StructureModuleId, page: number) => void;
  /** Button Chỉ: isolate mode only (optional page jump done by parent if desired) */
  onIsolate: (id: StructureModuleId) => void;
  onClearIsolate?: () => void;
  hideModes?: boolean;
};

/**
 * Quy chuẩn nút (một nút = một việc):
 * ☐ Hiện  → chỉ ẩn/hiện chữ lớp
 * Tới     → nhảy tới trang + tô đúng lớp đó (chỉ đường)
 * Tô      → chỉ bật/tắt khung tô (không nhảy trang)
 * Chỉ     → chỉ chế độ cô lập (ẩn lớp khác)
 */
export function DocumentStructurePanel({
  detected,
  presentation,
  mode,
  isolatedId = null,
  onModeChange,
  onToggleVisible,
  onToggleHighlight,
  onLocate,
  onIsolate,
  onClearIsolate,
  hideModes = false,
}: Props) {
  const isolating = isolatedId != null;
  const layers = detected.filter((m) => m.actionable);
  const notes = detected.filter((m) => !m.actionable);

  return (
    <div className="flex max-h-[38%] min-h-0 flex-col border-b border-[var(--border)] bg-[var(--panel)]">
      <div className="border-b border-[#edebe9] px-3 py-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--fg)]">Cấu trúc tài liệu</h2>
            <p className="text-[10px] text-[var(--muted)]">Không sửa PDF gốc</p>
          </div>
          {isolating && onClearIsolate ? (
            <button
              type="button"
              className="orc-btn orc-btn-primary shrink-0 !px-1.5 !py-0.5 !text-[10px]"
              onClick={onClearIsolate}
            >
              Hiện tất cả
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-[10px] leading-snug text-[var(--muted)]">
          Mở văn bản = chế độ <b className="font-medium text-[var(--fg)]">Đọc</b> (chỉ nội dung).{' '}
          <b className="font-medium text-[var(--fg)]">☐</b> ẩn/hiện ·{' '}
          <b className="font-medium text-[var(--fg)]">Tới</b> chỉ vùng ·{' '}
          <b className="font-medium text-[var(--fg)]">Tô</b> khung ·{' '}
          <b className="font-medium text-[var(--fg)]">Chỉ</b> cô lập
        </p>
        {!hideModes ? (
          <div className="mt-1.5 flex flex-wrap gap-1" role="toolbar" aria-label="Chế độ">
            {WORKBENCH_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mode === m.id}
                title={m.title}
                className={`orc-btn !px-1.5 !py-0.5 !text-[10px] ${
                  mode === m.id ? 'orc-btn-primary' : ''
                }`}
                onClick={() => onModeChange(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2 py-1 text-[11px]">
        {layers.length === 0 && notes.length === 0 ? (
          <p className="px-1 py-2 text-[var(--muted)]">Đang phân tích… hoặc chưa có lớp.</p>
        ) : null}

        {layers.length > 0 ? (
          <ul className="space-y-1">
            {layers.map((m) => {
              const st = presentation[m.moduleId] ?? DEFAULT_ROW;
              const isIsolated = isolatedId === m.moduleId;
              const dimmed = isolating && !isIsolated;
              const firstPage = m.pageNumbers[0] ?? 1;
              return (
                <li
                  key={m.moduleId}
                  className={`rounded border px-1.5 py-1 ${
                    isIsolated
                      ? 'border-[var(--accent)] bg-[#deecf9]'
                      : dimmed
                        ? 'border-transparent opacity-50'
                        : 'border-transparent hover:bg-[var(--bg)]'
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={st.visible}
                      disabled={isolating && !isIsolated}
                      onChange={() => onToggleVisible(m.moduleId)}
                      title="Chỉ ẩn/hiện chữ lớp này — không nhảy trang"
                      aria-label={`Ẩn hiện ${m.labelVi}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-medium text-[var(--fg)]"
                        title={dpkLabelForStone(m.moduleId)}
                      >
                        {m.labelVi}
                      </div>
                      <div className="text-[10px] text-[var(--muted)]">
                        {m.regionCount} vùng
                        {m.sampleText
                          ? ` · ${m.sampleText.slice(0, 42)}${m.sampleText.length > 42 ? '…' : ''}`
                          : ''}
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-1 flex flex-wrap gap-1 pl-5"
                    role="group"
                    aria-label={`Thao tác ${m.labelVi}`}
                  >
                    <button
                      type="button"
                      className="orc-btn !px-1.5 !py-0 !text-[10px]"
                      disabled={isolating && !isIsolated}
                      title="Nhảy tới vùng lớp này trên PDF"
                      onClick={() => onLocate(m.moduleId, firstPage)}
                    >
                      Tới
                    </button>
                    <button
                      type="button"
                      className={`orc-btn !px-1.5 !py-0 !text-[10px] ${
                        st.highlight && !isIsolated ? 'orc-btn-primary' : ''
                      }`}
                      disabled={isolating && !isIsolated}
                      title="Chỉ bật/tắt khung tô — không đổi trang"
                      aria-pressed={st.highlight}
                      onClick={() => onToggleHighlight(m.moduleId)}
                    >
                      Tô
                    </button>
                    <button
                      type="button"
                      className={`orc-btn !px-1.5 !py-0 !text-[10px] ${
                        isIsolated ? 'orc-btn-primary' : ''
                      }`}
                      title={
                        isIsolated
                          ? 'Tắt cô lập — hiện lại các lớp khác'
                          : 'Cô lập: ẩn mọi lớp khác (không phải nút điều hướng)'
                      }
                      aria-pressed={isIsolated}
                      onClick={() => onIsolate(m.moduleId)}
                    >
                      {isIsolated ? 'Đang chỉ' : 'Chỉ'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {notes.length > 0 ? (
          <div className={`${layers.length > 0 ? 'mt-2 border-t border-[var(--border)] pt-1.5' : ''}`}>
            <p className="px-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Ghi nhận trang
            </p>
            <p className="mb-1 px-1 text-[10px] text-[var(--muted)]">
              Chỉ thông tin — không có nút ẩn/tô
            </p>
            <ul className="space-y-0.5 px-1">
              {notes.map((m) => (
                <li key={m.moduleId} className="text-[11px] text-[var(--muted)]">
                  · {m.labelVi}
                  {m.pageNumbers.length > 0 ? ` · trang ${m.pageNumbers.join(', ')}` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const DEFAULT_ROW = { visible: true, highlight: false, focus: false };
