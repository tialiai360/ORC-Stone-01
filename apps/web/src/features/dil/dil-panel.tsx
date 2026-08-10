'use client';

import { DilDocumentResult, DilTextBlock } from '@orc/shared';
import { decideDilCorrection } from './api';

type DilPanelProps = {
  documentId: string;
  result: DilDocumentResult | null;
  loading: boolean;
  onUpdated: (next: DilDocumentResult) => void;
};

export function DilPanel({ documentId, result, loading, onUpdated }: DilPanelProps) {
  if (loading) {
    return (
      <div className="border-t border-[var(--border)] bg-[#fff4ce] px-3 py-1.5 text-[11px] text-[var(--fg)]">
        Đang chạy Document Intelligence…
      </div>
    );
  }
  if (!result) {
    return null;
  }

  const low = result.blocks.filter((b) => b.confidence < 95);
  const withSuggest = result.blocks.filter((b) => b.suggestions.length > 0);

  return (
    <div className="border-t border-[var(--border)] bg-[#fff4ce]/50 px-3 py-1.5 text-[11px] text-[var(--fg)]">
      <details className="group" open={low.length > 0 || withSuggest.length > 0}>
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
          <span className="font-semibold">
            <span className="mr-1 inline-block text-[var(--muted)] transition group-open:rotate-90">
              ▸
            </span>
            Lớp trí tuệ văn bản (DIL)
          </span>
          <span className="text-[var(--muted)]">Tin cậy {result.overallConfidence}%</span>
          <span className="text-[var(--muted)]">Thấp {result.stats.lowConfidenceCount}</span>
          <span className="text-[var(--muted)]">Ngờ {result.stats.suspiciousCount}</span>
          <span className="text-[var(--muted)]">Gợi ý {result.stats.suggestionCount}</span>
        </summary>

        <div className="mt-1.5 max-h-28 overflow-auto">
          {low.slice(0, 4).map((block) => (
            <DilBlockRow
              key={block.id}
              documentId={documentId}
              block={block}
              onUpdated={onUpdated}
            />
          ))}

          {withSuggest.length === 0 && low.length === 0 ? (
            <p className="text-[var(--muted)]">Không có khối độ tin cậy thấp.</p>
          ) : null}
        </div>
      </details>
    </div>
  );
}

function DilBlockRow({
  documentId,
  block,
  onUpdated,
}: {
  documentId: string;
  block: DilTextBlock;
  onUpdated: (next: DilDocumentResult) => void;
}) {
  return (
    <div
      className="mb-1.5 rounded border border-[#fce100] bg-white px-2 py-1"
      title="Độ tin cậy thấp"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{block.confidence}%</span>
        <span className="text-[var(--muted)]">{block.structureRole ?? 'unknown'}</span>
        {block.suspicious ? (
          <span className="rounded bg-[#fff4ce] px-1 text-[10px]">Đáng ngờ</span>
        ) : null}
      </div>
      <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-[var(--fg)]">
        {block.normalizedText || block.rawText}
      </p>
      {block.suspiciousReasons.length > 0 ? (
        <p className="mt-0.5 text-[10px] text-[var(--danger)]">
          {block.suspiciousReasons.join(' · ')}
        </p>
      ) : null}
      {block.suggestions.map((s) => (
        <div
          key={`${s.original}-${s.suggested}`}
          className="mt-1.5 flex flex-wrap items-center gap-2 rounded bg-[var(--panel-soft)] px-2 py-1"
        >
          <span>
            Có thể là: <strong>{s.suggested}</strong>
          </span>
          <button
            type="button"
            className="orc-btn orc-btn-primary !px-2 !py-0.5 !text-[11px]"
            onClick={() => {
              void decideDilCorrection({
                documentId,
                blockId: block.id,
                original: s.original,
                suggested: s.suggested,
                decision: 'accepted',
                packId: s.packId,
                packVersion: s.packVersion,
              }).then((r) => onUpdated(r.result));
            }}
          >
            Chấp nhận
          </button>
          <button
            type="button"
            className="orc-btn !px-2 !py-0.5 !text-[11px]"
            onClick={() => {
              void decideDilCorrection({
                documentId,
                blockId: block.id,
                original: s.original,
                suggested: s.suggested,
                decision: 'rejected',
                packId: s.packId,
                packVersion: s.packVersion,
              }).then((r) => onUpdated(r.result));
            }}
          >
            Bỏ qua
          </button>
        </div>
      ))}
    </div>
  );
}
