'use client';

import type { RegionCapability } from '../pdf/region-engine/types';

type Props = {
  capabilities: RegionCapability[];
  /** Visibility only */
  onToggleVisible?: (moduleId: string) => void;
  /** Navigate to layer on PDF */
  onLocate?: (moduleId: string) => void;
  visibleByModule?: Record<string, boolean>;
};

/**
 * Năng lực — báo cáo hiện diện.
 * Nút: Hiện = chỉ ẩn/hiện · Tới = chỉ điều hướng tới lớp.
 */
export function DocumentCapabilityPanel({
  capabilities,
  onToggleVisible,
  onLocate,
  visibleByModule = {},
}: Props) {
  const present = capabilities.filter((c) => c.present);
  const absent = capabilities.filter((c) => !c.present);
  const score =
    capabilities.length === 0
      ? null
      : Math.round((present.length / capabilities.length) * 1000) / 10;

  return (
    <div className="flex max-h-[28%] min-h-0 flex-col border-b border-[var(--border)] bg-[var(--panel)]">
      <div className="border-b border-[#edebe9] px-3 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--fg)]">Năng lực tài liệu</h2>
          {score != null ? (
            <span
              className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]"
              title="Tỷ lệ năng lực hiện diện"
            >
              {score}%
            </span>
          ) : null}
        </div>
        <p className="text-[10px] text-[var(--muted)]">
          Hiện = ẩn/hiện · Tới = nhảy tới lớp trên PDF
        </p>
      </div>
      <ul className="min-h-0 flex-1 overflow-auto px-2 py-1 text-[11px]">
        {capabilities.length === 0 ? (
          <li className="px-1 py-2 text-[var(--muted)]">Đang phân vùng…</li>
        ) : present.length === 0 ? (
          <li className="px-1 py-2 text-[var(--muted)]">Chưa phát hiện vùng hiện diện</li>
        ) : (
          present.map((c) => {
            const mid = c.moduleId;
            const visible = mid ? visibleByModule[mid] !== false : true;
            return (
              <li
                key={c.id}
                className="mb-0.5 flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-[var(--bg)]"
              >
                <span className="text-[#107c10]" aria-hidden>
                  ✓
                </span>
                <span className="min-w-0 flex-1 font-medium text-[var(--fg)]">
                  {c.labelVi}
                  {c.objectCount != null && c.objectCount > 0 ? (
                    <span className="ml-1 font-normal text-[var(--muted)]">×{c.objectCount}</span>
                  ) : null}
                  {c.doiConfirmed ? (
                    <span className="ml-1 text-[10px] font-normal text-[var(--muted)]">DOI</span>
                  ) : null}
                </span>
                {mid && onToggleVisible ? (
                  <button
                    type="button"
                    className="orc-btn !px-1 !py-0 !text-[10px]"
                    title="Chỉ ẩn/hiện lớp chữ — không nhảy trang"
                    onClick={() => onToggleVisible(mid)}
                  >
                    {visible ? 'Ẩn' : 'Hiện'}
                  </button>
                ) : null}
                {mid && onLocate ? (
                  <button
                    type="button"
                    className="orc-btn !px-1 !py-0 !text-[10px]"
                    title="Nhảy tới lớp này trên PDF"
                    onClick={() => onLocate(mid)}
                  >
                    Tới
                  </button>
                ) : null}
              </li>
            );
          })
        )}
        {absent.length > 0 ? (
          <li className="mt-1 border-t border-[var(--border)] pt-1">
            <p className="px-1 text-[10px] text-[var(--muted)]">Chưa thấy</p>
            <ul className="mt-0.5 space-y-0.5">
              {absent.map((c) => (
                <li key={c.id} className="px-1 text-[var(--muted)]">
                  ○ {c.labelVi}
                </li>
              ))}
            </ul>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
