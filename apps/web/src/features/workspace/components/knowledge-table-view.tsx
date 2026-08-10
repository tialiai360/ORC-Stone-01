'use client';

import { parseMarkdownTable } from '../knowledge/table-grid';

/** Compact HTML table for Knowledge brief — falls back to preformatted text. */
export function KnowledgeTableView({
  text,
  maxRows = 12,
}: {
  text: string;
  maxRows?: number;
}) {
  const rows = parseMarkdownTable(text);
  if (!rows || rows.length === 0) {
    return <span className="whitespace-pre-wrap break-words">{text}</span>;
  }
  const shown = rows.slice(0, maxRows);
  const extra = rows.length - shown.length;
  const head = shown[0] ?? [];
  const body = shown.slice(1);

  return (
    <div className="max-w-full overflow-x-auto rounded-sm border border-[var(--border)] bg-white">
      <table className="w-full border-collapse text-left text-[10px] leading-snug text-[var(--fg)]">
        <thead>
          <tr className="bg-[#f3f2f1]">
            {head.map((c, i) => (
              <th
                key={`h-${i}`}
                className="border border-[var(--border)] px-1.5 py-1 font-semibold"
              >
                {c || '—'}
              </th>
            ))}
          </tr>
        </thead>
        {body.length > 0 ? (
          <tbody>
            {body.map((r, ri) => (
              <tr key={`r-${ri}`} className={ri % 2 ? 'bg-[#faf9f8]' : undefined}>
                {r.map((c, ci) => (
                  <td key={`c-${ri}-${ci}`} className="border border-[var(--border)] px-1.5 py-1">
                    {c || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : null}
      </table>
      {extra > 0 ? (
        <p className="px-1.5 py-0.5 text-[9px] text-[var(--muted)]">+{extra} hàng…</p>
      ) : null}
    </div>
  );
}
