'use client';

import type { PageDiagnostics } from './types';

type Props = {
  open: boolean;
  onToggle: () => void;
  diagnostics: PageDiagnostics | null;
};

/** Developer diagnostics for Document Structure Pipeline (Interaction Layer). */
export function StructureDiagnosticsPanel({ open, onToggle, diagnostics }: Props) {
  return (
    <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col items-end gap-1">
      <button
        type="button"
        className="orc-btn pointer-events-auto !px-2 !py-0.5 !text-[10px] opacity-80 hover:opacity-100"
        onClick={onToggle}
        title="Chẩn đoán cấu trúc trang"
        aria-expanded={open}
      >
        {open ? 'Ẩn diag' : 'Diag'}
      </button>
      {open && diagnostics ? (
        <div className="pointer-events-auto max-w-[16rem] rounded border border-[var(--border)] bg-white/95 p-2 font-mono text-[10px] leading-relaxed text-[var(--fg)] shadow-md">
          <p className="mb-1 font-sans text-[11px] font-semibold">
            Trang {diagnostics.pageNumber} · {diagnostics.layout}
          </p>
          <ul className="space-y-0.5 text-[var(--muted)]">
            <li>Mục chữ: {diagnostics.textItems}</li>
            <li>Dòng: {diagnostics.lines}</li>
            <li>Đoạn: {diagnostics.paragraphs}</li>
            <li>Bảng: {diagnostics.tables}</li>
            <li>Đầu trang: {diagnostics.headers}</li>
            <li>Cuối trang: {diagnostics.footers}</li>
            <li>Watermark: {diagnostics.watermarks}</li>
            <li>Chữ ký: {diagnostics.signatures}</li>
            <li>Khối chọn: {diagnostics.selectionBlocks}</li>
            <li>Chữ mồ côi: {diagnostics.orphanText}</li>
            <li>Chữ ẩn: {diagnostics.invisibleText}</li>
            <li>Phủ chọn: {diagnostics.selectableCoverage}%</li>
            <li>Thứ tự đọc: {diagnostics.readingOrderConfidence}</li>
            {diagnostics.objectTotal != null ? (
              <>
                <li>Đối tượng: {diagnostics.objectTotal}</li>
                <li>Nhận diện: {diagnostics.objectRecognized ?? 0}</li>
                <li>Unknown: {diagnostics.objectUnknown ?? 0}</li>
                <li>Phủ object: {diagnostics.objectCoverage ?? 0}%</li>
                {diagnostics.objectByClass ? (
                  <li className="pt-0.5">
                    Lớp:{' '}
                    {Object.entries(diagnostics.objectByClass)
                      .filter(([, n]) => (n ?? 0) > 0)
                      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                      .slice(0, 8)
                      .map(([k, n]) => `${k}:${n}`)
                      .join(' · ') || '—'}
                  </li>
                ) : null}
              </>
            ) : null}
          </ul>
          {diagnostics.notes.length > 0 ? (
            <p className="mt-1 font-sans text-[10px] text-[var(--muted)]">
              {diagnostics.notes.join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
