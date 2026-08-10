'use client';

import { StructureCorrectedEvidence } from '@orc/shared';

type WorkspaceEvidenceFooterProps = {
  evidence: Array<StructureCorrectedEvidence & { id?: string }>;
};

export function WorkspaceEvidenceFooter({ evidence }: WorkspaceEvidenceFooterProps) {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-[11px] text-[var(--muted)]">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 py-0.5 font-semibold text-[var(--fg)] [&::-webkit-details-marker]:hidden">
          <span className="text-[var(--muted)] transition group-open:rotate-90">▸</span>
          Bằng chứng chỉnh sửa ({evidence.length})
          {evidence.length === 0 ? (
            <span className="font-normal text-[var(--muted)]">
              — ghi nhận khi Lưu (reason tùy chọn)
            </span>
          ) : null}
        </summary>
        <div className="max-h-20 overflow-auto pb-1">
          {evidence.length === 0 ? (
            <p>Chưa có bằng chứng — mỗi chỉnh sửa thủ công sẽ ghi nhận khi Lưu.</p>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {evidence
                .slice()
                .reverse()
                .slice(0, 6)
                .map((e, idx) => (
                  <li key={`${e.timestamp}-${idx}`}>
                    {e.timestamp} · {e.originalClassification ?? '—'} →{' '}
                    {e.newClassification ?? e.nodeId} · {e.reviewer}
                    {e.reason ? ` · ${e.reason}` : ''}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </details>
    </footer>
  );
}
