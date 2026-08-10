'use client';

import { useCallback, useState, type DragEvent, type ReactNode } from 'react';
import type { LayoutLayer, LayerDisposition } from '../workspace/knowledge/layout-layers';

type Zone = 'reading' | 'shelf';

type Props = {
  layers: LayoutLayer[];
  dispositions: Record<string, LayerDisposition>;
  focusedLayerId: string | null;
  isolating: boolean;
  onDisposition: (layerId: string, d: LayerDisposition) => void;
  /** Click lớp: chỉ hiện lớp đó + fit vùng (bấm lại = bỏ chọn). */
  onSelectLayer: (layerId: string | null) => void;
  /** Chỉ fit vùng, không đổi isolate. */
  onFitLayer: (layerId: string) => void;
  onClearIsolate: () => void;
  onKeepAllContent: () => void;
  onDiscardChrome: () => void;
};

const DND_TYPE = 'application/x-orc-layout-layer';

function effective(
  layer: LayoutLayer,
  dispositions: Record<string, LayerDisposition>,
): LayerDisposition {
  return dispositions[layer.id] ?? layer.defaultDisposition;
}

function zoneOf(
  layer: LayoutLayer,
  dispositions: Record<string, LayerDisposition>,
): Zone {
  return effective(layer, dispositions) === 'discard' ? 'shelf' : 'reading';
}

function LayerCard({
  layer,
  focused,
  isolating,
  zone,
  onSelect,
  onFit,
  onQuickMove,
}: {
  layer: LayoutLayer;
  focused: boolean;
  isolating: boolean;
  zone: Zone;
  onSelect: () => void;
  onFit: () => void;
  onQuickMove: () => void;
}) {
  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData(DND_TYPE, layer.id);
    e.dataTransfer.setData('text/plain', layer.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <li
      draggable
      onDragStart={onDragStart}
      className={`cursor-grab rounded border px-2 py-1.5 active:cursor-grabbing ${
        focused ? 'border-[#0078d4] bg-[#deecf9]' : 'border-[#edebe9] bg-white'
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 select-none text-[12px] leading-none text-[#a19f9d]"
          aria-hidden
          title="Kéo thả"
        >
          ⠿
        </span>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onSelect}
          title="Chỉ hiện lớp này trên PDF + phóng vừa vùng"
        >
          <span className="block text-[11px] font-medium text-[#323130]">
            {layer.labelVi}
            {focused && isolating ? (
              <span className="ml-1 font-normal text-[#0078d4]">· đang chỉ lớp này</span>
            ) : null}
            <span className="ml-1 font-normal text-[#605e5c]">
              · {layer.kind}
              {layer.pageNumbers.length > 0 ? ` · p.${layer.pageNumbers.join(',')}` : ''}
            </span>
          </span>
          {layer.textPreview ? (
            <span className="mt-0.5 line-clamp-2 block text-[10px] leading-snug text-[#605e5c]">
              {layer.textPreview}
            </span>
          ) : (
            <span className="mt-0.5 block text-[10px] italic text-[#a19f9d]">
              (không có chữ trích — có thể chỉ trên canvas)
            </span>
          )}
        </button>
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            className="orc-btn !px-1.5 !py-0 !text-[10px]"
            onClick={(e) => {
              e.stopPropagation();
              onFit();
            }}
            title="Phóng vừa vùng lớp trên PDF"
          >
            Fit
          </button>
          <button
            type="button"
            className="orc-btn !px-1.5 !py-0 !text-[10px]"
            onClick={(e) => {
              e.stopPropagation();
              onQuickMove();
            }}
            title={
              zone === 'reading'
                ? 'Ẩn / gác lớp này khỏi mặt đọc'
                : 'Đưa lại vùng đang đọc'
            }
          >
            {zone === 'reading' ? 'Ẩn' : '← Đọc'}
          </button>
        </div>
      </div>
    </li>
  );
}

function DropZone({
  zone,
  title,
  hint,
  count,
  active,
  children,
  onDropLayer,
}: {
  zone: Zone;
  title: string;
  hint: string;
  count: number;
  active: boolean;
  children: ReactNode;
  onDropLayer: (layerId: string) => void;
}) {
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData(DND_TYPE) || e.dataTransfer.getData('text/plain');
    if (id) onDropLayer(id);
  };

  return (
    <div
      data-orc-layer-zone={zone}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex min-h-[72px] flex-col rounded border border-dashed px-1.5 py-1.5 transition-colors ${
        active
          ? 'border-[#0078d4] bg-[#deecf9]'
          : zone === 'shelf'
            ? 'border-[#c8c6c4] bg-[#f3f2f1]'
            : 'border-[#edebe9] bg-white'
      }`}
    >
      <div className="mb-1 flex items-baseline justify-between gap-2 px-1">
        <h4 className="text-[11px] font-semibold text-[#323130]">
          {title}
          <span className="ml-1 font-normal text-[#605e5c]">({count})</span>
        </h4>
        <span className="text-[9px] text-[#a19f9d]">{hint}</span>
      </div>
      {count === 0 ? (
        <p className="px-1 py-2 text-center text-[10px] italic text-[#a19f9d]">
          {zone === 'shelf'
            ? 'Kéo lớp không cần đọc vào đây'
            : 'Kéo lớp cần đọc vào đây'}
        </p>
      ) : (
        <ul className="space-y-1">{children}</ul>
      )}
    </div>
  );
}

/**
 * Clean Desk — kéo thả Đang đọc ↔ Gác xếp; click lớp = chỉ hiện + fit; Ẩn = gác xếp.
 */
export function DeskLayerInspector({
  layers,
  dispositions,
  focusedLayerId,
  isolating,
  onDisposition,
  onSelectLayer,
  onFitLayer,
  onClearIsolate,
  onKeepAllContent,
  onDiscardChrome,
}: Props) {
  const [dragOverZone, setDragOverZone] = useState<Zone | null>(null);

  const moveTo = useCallback(
    (layerId: string, zone: Zone) => {
      onDisposition(layerId, zone === 'shelf' ? 'discard' : 'keep');
      setDragOverZone(null);
    },
    [onDisposition],
  );

  const onZoneDragEnter = useCallback((zone: Zone) => {
    setDragOverZone(zone);
  }, []);

  const onZoneDragLeave = useCallback((e: DragEvent, zone: Zone) => {
    const related = e.relatedTarget as Node | null;
    if (related && (e.currentTarget as HTMLElement).contains(related)) return;
    setDragOverZone((z) => (z === zone ? null : z));
  }, []);

  if (layers.length === 0) {
    return (
      <div className="border-b border-[#edebe9] bg-[#fff4ce] px-3 py-2 text-[11px] text-[#605e5c]">
        Đang tách lớp từ trang đối chiếu… Mở/đổi trang PDF để nhận diện watermark · đầu trang ·
        nội dung · chữ ký…
      </div>
    );
  }

  const reading = layers.filter((l) => zoneOf(l, dispositions) === 'reading');
  const shelf = layers.filter((l) => zoneOf(l, dispositions) === 'shelf');

  return (
    <section className="flex max-h-[42vh] shrink-0 flex-col border-b border-[#edebe9] bg-[#faf9f8]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#edebe9] px-3 py-1.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-semibold text-[#323130]">
            Lớp đã bóc · gác xếp ({layers.length})
          </h3>
          <p className="text-[10px] text-[#605e5c]">
            Click lớp = chỉ hiện + Fit · Ẩn = gác khỏi mặt đọc · kéo thả giữa hai khu
          </p>
        </div>
        <button
          type="button"
          className="orc-btn !px-1.5 !py-0 !text-[10px]"
          onClick={onDiscardChrome}
          title="Gác watermark / ký / đầu-cuối trang"
        >
          Gác chrome
        </button>
        <button
          type="button"
          className="orc-btn !px-1.5 !py-0 !text-[10px]"
          onClick={onKeepAllContent}
        >
          Về đang đọc
        </button>
        <button
          type="button"
          className="orc-btn !px-1.5 !py-0 !text-[10px]"
          onClick={onClearIsolate}
          disabled={!isolating}
          title="Bỏ chế độ chỉ một lớp — hiện lại các lớp đang đọc"
        >
          Bỏ chỉ lớp
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-2">
        <div
          onDragEnter={() => onZoneDragEnter('reading')}
          onDragLeave={(e) => onZoneDragLeave(e, 'reading')}
        >
          <DropZone
            zone="reading"
            title="Đang đọc"
            hint="keep · chữ rõ trên mặt đọc"
            count={reading.length}
            active={dragOverZone === 'reading'}
            onDropLayer={(id) => moveTo(id, 'reading')}
          >
            {reading.map((layer) => (
              <LayerCard
                key={layer.id}
                layer={layer}
                focused={focusedLayerId === layer.id}
                isolating={isolating}
                zone="reading"
                onSelect={() =>
                  onSelectLayer(focusedLayerId === layer.id && isolating ? null : layer.id)
                }
                onFit={() => onFitLayer(layer.id)}
                onQuickMove={() => moveTo(layer.id, 'shelf')}
              />
            ))}
          </DropZone>
        </div>

        <div
          onDragEnter={() => onZoneDragEnter('shelf')}
          onDragLeave={(e) => onZoneDragLeave(e, 'shelf')}
        >
          <DropZone
            zone="shelf"
            title="Gác xếp"
            hint="discard · tách khỏi mặt đọc"
            count={shelf.length}
            active={dragOverZone === 'shelf'}
            onDropLayer={(id) => moveTo(id, 'shelf')}
          >
            {shelf.map((layer) => (
              <LayerCard
                key={layer.id}
                layer={layer}
                focused={focusedLayerId === layer.id}
                isolating={isolating}
                zone="shelf"
                onSelect={() =>
                  onSelectLayer(focusedLayerId === layer.id && isolating ? null : layer.id)
                }
                onFit={() => onFitLayer(layer.id)}
                onQuickMove={() => moveTo(layer.id, 'reading')}
              />
            ))}
          </DropZone>
        </div>
      </div>
    </section>
  );
}
