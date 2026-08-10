'use client';

import type { LayoutLayer, LayerDisposition } from '../knowledge/layout-layers';

type Props = {
  layers: LayoutLayer[];
  dispositions: Record<string, LayerDisposition>;
  focusedLayerId: string | null;
  onDisposition: (layerId: string, d: LayerDisposition) => void;
  onFocusLayer: (layerId: string | null) => void;
  onGoPage: (page: number) => void;
};

function isKept(
  layer: LayoutLayer,
  dispositions: Record<string, LayerDisposition>,
): boolean {
  const d = dispositions[layer.id] ?? layer.defaultDisposition;
  return d === 'keep' || d === 'review';
}

/**
 * Chọn phần nào dùng để đọc — Keep/Skip đơn giản; gợi ý Knowledge chỉ ở Work Brief.
 * Ẩn hoàn toàn khi chưa tách được lớp (tránh dead chrome).
 */
export function LayoutLayerPanel({
  layers,
  dispositions,
  focusedLayerId,
  onDisposition,
  onFocusLayer,
  onGoPage,
}: Props) {
  if (layers.length === 0) {
    return null;
  }

  const used = layers.filter((l) => isKept(l, dispositions)).length;
  const skipped = layers.length - used;

  return (
    <section className="shrink-0 border-b border-[var(--border)] bg-[#faf9f8]">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
        <div>
          <h3 className="text-[11px] font-semibold text-[var(--fg)]">
            Phần trên văn bản
          </h3>
          <p className="text-[10px] text-[var(--muted)]">
            Dùng để đọc / Bỏ khỏi đọc · {used} dùng · {skipped} bỏ · gợi ý ở Tóm tắt bên dưới
          </p>
        </div>
      </div>
      <ul className="max-h-[28vh] space-y-1 overflow-y-auto px-2 pb-2">
        {layers.map((layer) => {
          const kept = isKept(layer, dispositions);
          const focused = focusedLayerId === layer.id;
          return (
            <li
              key={layer.id}
              className={`rounded border px-1.5 py-1 ${
                focused
                  ? 'border-[var(--accent)] bg-[#deecf9]/80'
                  : 'border-[var(--border)] bg-[var(--bg)]'
              }`}
            >
              <div className="flex items-start gap-1">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    onFocusLayer(focused ? null : layer.id);
                    const p = layer.pageNumbers[0];
                    if (p) onGoPage(p);
                  }}
                >
                  <span className="block text-[11px] font-medium text-[var(--fg)]">
                    {layer.labelVi}
                    <span className="ml-1 font-normal text-[var(--muted)]">
                      p.{layer.pageNumbers.join(',')}
                      {layer.knowledgeHints.length > 0
                        ? ` · ${layer.knowledgeHints.length} gợi ý`
                        : ''}
                    </span>
                  </span>
                  {layer.textPreview ? (
                    <span className="mt-0.5 line-clamp-2 block text-[10px] text-[var(--muted)]">
                      {layer.textPreview}
                    </span>
                  ) : null}
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-0.5">
                <button
                  type="button"
                  className={`orc-btn !px-1.5 !py-0 !text-[10px] ${
                    kept ? 'orc-btn-primary' : ''
                  }`}
                  onClick={() => onDisposition(layer.id, 'keep')}
                >
                  Dùng để đọc
                </button>
                <button
                  type="button"
                  className={`orc-btn !px-1.5 !py-0 !text-[10px] ${
                    !kept ? 'orc-btn-primary' : ''
                  }`}
                  onClick={() => onDisposition(layer.id, 'discard')}
                >
                  Bỏ khỏi đọc
                </button>
              </div>
              {focused && !kept ? (
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  Đã bỏ khỏi đọc — bản gốc Evidence vẫn giữ. Gợi ý Knowledge không lấy từ phần
                  này.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
