'use client';

import { objectClassLabelVi } from '../pdf/intelligence/doi/labels-vi';
import type { RecognitionMapCell } from './types';

type Props = {
  cells: RecognitionMapCell[];
  pageNumber: number;
  focusedId: string | null;
  onSelectCell: (cell: RecognitionMapCell) => void;
};

const SOURCE_COLOR: Record<string, string> = {
  region: '#605e5c',
  object: '#0078d4',
};

/**
 * Recognition Map — compact spatial overview of the current page.
 * Click = locate (navigate/focus), not visibility toggle.
 */
export function RecognitionMapPanel({
  cells,
  pageNumber,
  focusedId,
  onSelectCell,
}: Props) {
  const pageCells = cells.filter((c) => c.pageNumber === pageNumber);

  return (
    <div className="flex max-h-[22%] min-h-0 flex-col border-b border-[var(--border)] bg-[var(--panel)]">
      <div className="border-b border-[#edebe9] px-3 py-1.5">
        <h2 className="text-sm font-semibold text-[var(--fg)]">Bản đồ nhận diện</h2>
        <p className="text-[10px] text-[var(--muted)]">
          Trang {pageNumber} · bấm ô = chỉ đến vùng · xám=vùng · xanh=đối tượng
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {pageCells.length === 0 ? (
          <p className="px-1 py-2 text-[11px] text-[var(--muted)]">
            Chưa có vùng/đối tượng trên trang này.
          </p>
        ) : (
          <div
            className="relative mx-auto aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded border border-[var(--border)] bg-[#f3f2f1]"
            role="img"
            aria-label={`Bản đồ nhận diện trang ${pageNumber}`}
          >
            {pageCells.map((c) => {
              const active =
                focusedId === c.id ||
                focusedId === c.id.replace(/^object:/, '') ||
                focusedId === `object:${focusedId}`;
              const color = SOURCE_COLOR[c.source] ?? '#0078d4';
              return (
                <button
                  key={c.id}
                  type="button"
                  className="absolute box-border hover:opacity-100"
                  style={{
                    left: `${c.left}%`,
                    top: `${c.top}%`,
                    width: `${Math.max(c.width, 1.5)}%`,
                    height: `${Math.max(c.height, 1.2)}%`,
                    border: active ? `2px solid var(--accent)` : `1px solid ${color}`,
                    background: active
                      ? 'color-mix(in srgb, var(--accent) 28%, transparent)'
                      : c.corrected
                        ? 'color-mix(in srgb, #107c10 22%, transparent)'
                        : `color-mix(in srgb, ${color} 16%, transparent)`,
                    opacity: active ? 1 : 0.85,
                  }}
                  title={`${c.label}${c.objectClass ? ` · ${objectClassLabelVi(c.objectClass)}` : ''}`}
                  onClick={() => onSelectCell(c)}
                />
              );
            })}
          </div>
        )}
        {pageCells.length > 0 ? (
          <ul className="mt-1.5 max-h-16 space-y-0.5 overflow-auto px-0.5 text-[10px] text-[var(--muted)]">
            {pageCells.slice(0, 24).map((c) => (
              <li key={`leg-${c.id}`}>
                <button
                  type="button"
                  className="w-full truncate text-left hover:text-[var(--fg)]"
                  onClick={() => onSelectCell(c)}
                >
                  {c.source === 'object' ? '●' : '□'}{' '}
                  {c.objectClass ? objectClassLabelVi(c.objectClass) : c.label}
                  {c.corrected ? ' · đã sửa' : ''}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
