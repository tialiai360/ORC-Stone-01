'use client';

type SimilarSuggestionProps = {
  open: boolean;
  count: number;
  sample: string;
  onYes: () => void;
  onNo: () => void;
};

export function SimilarSuggestion({
  open,
  count,
  sample,
  onYes,
  onNo,
}: SimilarSuggestionProps) {
  if (!open || count <= 0) {
    return null;
  }

  return (
    <div className="fixed right-3 bottom-24 z-50 w-[300px] rounded border border-[var(--border)] bg-white p-3 shadow-md">
      <p className="text-sm font-semibold text-[var(--fg)]">Có {count} đoạn tương tự.</p>
      <p className="mt-0.5 text-[11px] text-[var(--muted)]">Áp dụng luôn?</p>
      <p className="mt-2 line-clamp-2 rounded bg-[var(--panel-soft)] px-2 py-1 text-[11px] text-[var(--fg)]">
        {sample}
      </p>
      <div className="mt-2.5 flex justify-end gap-2">
        <button type="button" className="orc-btn" onClick={onNo}>
          Không
        </button>
        <button type="button" className="orc-btn orc-btn-primary" onClick={onYes}>
          Có
        </button>
      </div>
    </div>
  );
}
