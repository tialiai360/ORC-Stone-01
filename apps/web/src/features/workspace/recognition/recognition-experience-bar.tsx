'use client';

import type { RecognitionSummary } from './types';

type Props = {
  summary: RecognitionSummary;
  mapOpen: boolean;
  onToggleMap: () => void;
  onClearCorrections?: () => void;
  /** When true, show “content-only” cue (default open mode). */
  contentOnly?: boolean;
};

/**
 * Recognition Experience — thin strip above workbench (additive).
 * Surfaces what the system recognized without changing engine output.
 */
export function RecognitionExperienceBar({
  summary,
  mapOpen,
  onToggleMap,
  onClearCorrections,
  contentOnly = false,
}: Props) {
  if (summary.pagesAnalyzed === 0) {
    return (
      <div className="flex items-center gap-2 border-b border-[#edebe9] bg-[var(--panel)] px-3 py-1 text-[11px] text-[var(--muted)]">
        <span className="font-medium text-[var(--fg)]">Nhận diện</span>
        <span>Đang chờ phân tích trang…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#edebe9] bg-[var(--panel)] px-3 py-1 text-[11px] text-[var(--muted)]">
      <span className="font-semibold text-[var(--fg)]">Nhận diện</span>
      {contentOnly ? (
        <span className="text-[var(--fg)]" title="Đã bóc lớp chrome — chỉ còn nội dung văn bản">
          Đọc · chỉ nội dung
        </span>
      ) : null}
      <span title="Số trang đã phân tích">
        {summary.pagesAnalyzed} trang
      </span>
      <span title="Đối tượng DOI (đã trừ từ chối)">
        {summary.objectCount} đối tượng
      </span>
      <span title="Lớp cấu trúc có vùng">
        {summary.moduleCount} lớp
      </span>
      {summary.capabilityTotal > 0 ? (
        <span title="Năng lực vùng hiện diện">
          {summary.capabilityPresent}/{summary.capabilityTotal} năng lực
        </span>
      ) : null}
      {summary.lowConfidenceCount > 0 ? (
        <span className="text-[#8a6414]" title="Độ tin cậy thấp — nên xác nhận/sửa">
          {summary.lowConfidenceCount} thấp tin cậy
        </span>
      ) : null}
      {summary.correctionCount > 0 ? (
        <span className="text-[var(--accent)]" title="Hiệu chỉnh người (progressive)">
          {summary.correctionCount} sửa tay
          {summary.rejectedCount > 0 ? ` · ${summary.rejectedCount} từ chối` : ''}
        </span>
      ) : null}
      <span className="ml-auto flex items-center gap-1">
        <button
          type="button"
          className={`orc-btn !px-1.5 !py-0 !text-[10px] ${mapOpen ? 'orc-btn-primary' : ''}`}
          aria-pressed={mapOpen}
          title="Bật/tắt Recognition Map trên PDF"
          onClick={onToggleMap}
        >
          Bản đồ
        </button>
        {summary.correctionCount > 0 && onClearCorrections ? (
          <button
            type="button"
            className="orc-btn !px-1.5 !py-0 !text-[10px]"
            title="Xóa toàn bộ hiệu chỉnh đã lưu trên máy"
            onClick={onClearCorrections}
          >
            Xóa sửa
          </button>
        ) : null}
      </span>
    </div>
  );
}
