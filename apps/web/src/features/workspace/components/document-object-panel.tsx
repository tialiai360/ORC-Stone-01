'use client';

import { objectClassLabelVi } from '../pdf/intelligence/doi/labels-vi';
import { RECLASS_OPTIONS } from '../recognition/apply-corrections';
import type { DisplayObjectInsight } from '../recognition/types';

type Props = {
  objects: DisplayObjectInsight[];
  focusedObjectId: string | null;
  hiddenClasses: Set<string>;
  debugBoxes: boolean;
  scopeAllPages?: boolean;
  onScopeAllPagesChange?: (all: boolean) => void;
  onFocusObject: (id: string | null, pageNumber?: number) => void;
  onToggleClass: (objectClass: string) => void;
  onToggleDebug: () => void;
  onConfirmObject?: (o: DisplayObjectInsight) => void;
  onRejectObject?: (o: DisplayObjectInsight) => void;
  onReclassObject?: (o: DisplayObjectInsight, nextClass: string) => void;
  onClearObjectCorrection?: (o: DisplayObjectInsight) => void;
};

/**
 * Document Object Explorer — DOI objects + Human Correction layer.
 * Presentation only; raw PDF and engine graphs stay immutable.
 */
export function DocumentObjectPanel({
  objects,
  focusedObjectId,
  hiddenClasses,
  debugBoxes,
  scopeAllPages = false,
  onScopeAllPagesChange,
  onFocusObject,
  onToggleClass,
  onToggleDebug,
  onConfirmObject,
  onRejectObject,
  onReclassObject,
  onClearObjectCorrection,
}: Props) {
  const signal = objects.filter((o) => o.displayClass !== 'body-text');
  const live = signal.filter((o) => !o.rejected);
  const rejected = signal.filter((o) => o.rejected);

  const byClass = new Map<string, DisplayObjectInsight[]>();
  for (const o of live) {
    const list = byClass.get(o.displayClass) ?? [];
    list.push(o);
    byClass.set(o.displayClass, list);
  }
  const classes = [...byClass.keys()].sort();

  return (
    <div className="flex max-h-[32%] min-h-0 flex-col border-b border-[var(--border)] bg-[var(--panel)]">
      <div className="border-b border-[#edebe9] px-3 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--fg)]">Đối tượng tài liệu</h2>
          <div className="flex items-center gap-1">
            {onScopeAllPagesChange ? (
              <button
                type="button"
                className={`orc-btn !px-1.5 !py-0 !text-[10px] ${scopeAllPages ? 'orc-btn-primary' : ''}`}
                aria-pressed={scopeAllPages}
                title="Xem đối tượng mọi trang đã phân tích"
                onClick={() => onScopeAllPagesChange(!scopeAllPages)}
              >
                {scopeAllPages ? 'Mọi trang' : 'Trang này'}
              </button>
            ) : null}
            <button
              type="button"
              className={`orc-btn !px-1.5 !py-0 !text-[10px] ${debugBoxes ? 'orc-btn-primary' : ''}`}
              aria-pressed={debugBoxes}
              title="Hiện khung đối tượng DOI (debug trình bày)"
              onClick={onToggleDebug}
            >
              Khung
            </button>
          </div>
        </div>
        <p className="text-[10px] text-[var(--muted)]">
          Ẩn = chỉ ẩn · bấm mục = chỉ đến · ✓/✕/đổi lớp = sửa tay (lưu máy)
        </p>
      </div>
      <ul className="min-h-0 flex-1 overflow-auto px-2 py-1 text-[11px]">
        {live.length === 0 && rejected.length === 0 ? (
          <li className="px-1 py-2 text-[var(--muted)]">
            Chưa có đối tượng tín hiệu (hoặc đang phân tích)…
          </li>
        ) : (
          classes.map((cls) => {
            const items = byClass.get(cls) ?? [];
            const hidden = hiddenClasses.has(cls);
            return (
              <li key={cls} className="mb-1.5">
                <div className="flex items-center gap-1 px-1">
                  <span className="min-w-0 flex-1 font-medium text-[var(--fg)]">
                    {objectClassLabelVi(cls)}
                    <span className="ml-1 text-[10px] font-normal text-[var(--muted)]">
                      ({items.length})
                    </span>
                  </span>
                  <button
                    type="button"
                    className="orc-btn !px-1 !py-0 !text-[10px]"
                    title="Chỉ ẩn/hiện lớp đối tượng — không nhảy trang"
                    onClick={() => onToggleClass(cls)}
                  >
                    {hidden ? 'Hiện' : 'Ẩn'}
                  </button>
                </div>
                {!hidden ? (
                  <ul className="mt-0.5 space-y-0.5 pl-1">
                    {items.slice(0, 24).map((o) => {
                      const active = focusedObjectId === o.id;
                      return (
                        <li key={o.id} className="rounded px-0.5 py-0.5 hover:bg-[var(--bg)]">
                          <button
                            type="button"
                            className={`w-full rounded px-1 py-0.5 text-left ${
                              active ? 'bg-[#deecf9] ring-1 ring-[var(--accent)]' : ''
                            }`}
                            onClick={() => onFocusObject(active ? null : o.id, o.pageNumber)}
                            title={`Chỉ đến · ${o.reasons.slice(0, 4).join(' · ')}`}
                          >
                            <span className="line-clamp-2 text-[var(--fg)]">
                              {o.textPreview || o.id}
                              {o.corrected ? (
                                <span className="ml-1 text-[10px] text-[#107c10]">đã sửa</span>
                              ) : null}
                              {o.confirmed ? (
                                <span className="ml-1 text-[10px] text-[var(--accent)]">✓</span>
                              ) : null}
                            </span>
                            <span className="block text-[10px] text-[var(--muted)]">
                              {scopeAllPages ? `p.${o.pageNumber} · ` : ''}
                              {o.confidence} · {Math.round(o.confidenceScore * 100)}%
                              {o.corrected && o.originalClass !== o.displayClass
                                ? ` · từ ${objectClassLabelVi(o.originalClass)}`
                                : ''}
                              {o.regionHint ? ` · ${o.regionHint}` : ''}
                            </span>
                          </button>
                          {active &&
                          (onConfirmObject || onRejectObject || onReclassObject) ? (
                            <div
                              className="mt-0.5 flex flex-wrap items-center gap-1 px-1"
                              role="group"
                              aria-label="Hiệu chỉnh đối tượng"
                            >
                              {onConfirmObject ? (
                                <button
                                  type="button"
                                  className="orc-btn !px-1 !py-0 !text-[10px]"
                                  title="Xác nhận đúng lớp (progressive)"
                                  onClick={() => onConfirmObject(o)}
                                >
                                  ✓ Đúng
                                </button>
                              ) : null}
                              {onRejectObject ? (
                                <button
                                  type="button"
                                  className="orc-btn !px-1 !py-0 !text-[10px]"
                                  title="Từ chối phát hiện này (ẩn khỏi nhận diện)"
                                  onClick={() => onRejectObject(o)}
                                >
                                  ✕ Sai
                                </button>
                              ) : null}
                              {onReclassObject ? (
                                <label className="flex items-center gap-0.5 text-[10px] text-[var(--muted)]">
                                  Đổi
                                  <select
                                    className="max-w-[7.5rem] rounded border border-[var(--border)] bg-[var(--panel)] px-0.5 py-0 text-[10px] text-[var(--fg)]"
                                    value={o.displayClass}
                                    title="Đổi lớp đối tượng (presentation)"
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      if (next && next !== o.displayClass) {
                                        onReclassObject(o, next);
                                      }
                                    }}
                                  >
                                    {RECLASS_OPTIONS.map((c) => (
                                      <option key={c} value={c}>
                                        {objectClassLabelVi(c)}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : null}
                              {o.corrected && onClearObjectCorrection ? (
                                <button
                                  type="button"
                                  className="orc-btn !px-1 !py-0 !text-[10px]"
                                  title="Gỡ hiệu chỉnh — về kết quả engine"
                                  onClick={() => onClearObjectCorrection(o)}
                                >
                                  Gỡ
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })
        )}
        {rejected.length > 0 ? (
          <li className="mt-1 border-t border-[var(--border)] pt-1">
            <p className="px-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Đã từ chối ({rejected.length})
            </p>
            <ul className="mt-0.5 space-y-0.5 px-1">
              {rejected.slice(0, 12).map((o) => (
                <li key={o.id} className="flex items-center gap-1 text-[var(--muted)] line-through">
                  <span className="min-w-0 flex-1 truncate">
                    {o.textPreview || objectClassLabelVi(o.originalClass)}
                  </span>
                  {onClearObjectCorrection ? (
                    <button
                      type="button"
                      className="orc-btn !px-1 !py-0 !text-[10px] no-underline"
                      onClick={() => onClearObjectCorrection(o)}
                    >
                      Khôi phục
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
