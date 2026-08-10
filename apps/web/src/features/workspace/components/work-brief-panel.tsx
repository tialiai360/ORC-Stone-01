'use client';

import { useMemo, useState } from 'react';
import {
  ClassificationAssignment,
  KNOWLEDGE_NODES,
  type KnowledgeNodeId,
} from '@orc/shared';
import type { FieldSuggestion } from '../knowledge/suggest-knowledge-fields';
import type { PeeledChromeItem } from '../knowledge/peel-chrome';
import { looksLikeMarkdownTable } from '../knowledge/table-grid';
import { KnowledgeTableView } from './knowledge-table-view';

/** Primary dossier fields for HO work (order = reading brief). */
export const DOSSIER_ORDER: KnowledgeNodeId[] = [
  'loai-van-ban',
  'so-van-ban',
  'ngay-ban-hanh',
  'trich-yeu',
  'don-vi-ban-hanh',
  'doi-tuong',
  'noi-nhan',
  'noi-dung',
  'yeu-cau',
  'thoi-han',
  'nguoi-ky',
  'can-cu',
  'hieu-luc',
  'bieu-mau',
  'van-ban-lien-quan',
];

type TextStatus = 'unknown' | 'ready' | 'empty';

type Props = {
  documentTitle?: string;
  assignments: ClassificationAssignment[];
  activeNodeId: string | null;
  suggestions: FieldSuggestion[];
  peeledChrome?: PeeledChromeItem[];
  /** Reflects «Chỉ nội dung» vs «Hiện đủ lớp». */
  contentOnly?: boolean;
  /** Embedded text on Evidence page — Work Desk honesty (EC-003). */
  textStatus?: TextStatus;
  /** Evidence PDF panel currently visible. */
  evidenceOpen?: boolean;
  onArmNode: (nodeId: string) => void;
  onOpenAssignment: (a: ClassificationAssignment) => void;
  onUpdateAssignmentText: (id: string, text: string) => void;
  onAcceptSuggestion: (s: FieldSuggestion) => void;
  onDismissSuggestion: (id: string) => void;
  onAcceptAllHigh: () => void;
  onRefreshSuggestions: () => void;
  onLocateEvidence?: (pageNumber: number) => void;
  onOpenEvidence?: () => void;
  onSave: () => void;
  dirty: boolean;
  saving: boolean;
};

function firstText(
  byNode: Map<string, ClassificationAssignment[]>,
  suggestions: FieldSuggestion[],
  nodeId: KnowledgeNodeId,
): { text: string; pageNumber?: number; pending?: boolean } | null {
  const confirmed = byNode.get(nodeId)?.[0];
  if (confirmed?.text?.trim()) {
    return { text: confirmed.text.trim(), pageNumber: confirmed.pageNumber };
  }
  const sug = suggestions.find((s) => s.nodeId === nodeId);
  if (sug?.text?.trim()) {
    return { text: sug.text.trim(), pageNumber: sug.pageNumber, pending: true };
  }
  return null;
}

/**
 * Knowledge dossier + suggest→confirm (G3).
 * No silent library write. No batch auto.
 */
export function WorkBriefPanel({
  documentTitle,
  assignments,
  activeNodeId,
  suggestions,
  peeledChrome = [],
  contentOnly = true,
  textStatus = 'unknown',
  evidenceOpen = true,
  onArmNode,
  onOpenAssignment,
  onUpdateAssignmentText,
  onAcceptSuggestion,
  onDismissSuggestion,
  onAcceptAllHigh,
  onRefreshSuggestions,
  onLocateEvidence,
  onOpenEvidence,
  onSave,
  dirty,
  saving,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const byNode = useMemo(() => {
    const map = new Map<string, ClassificationAssignment[]>();
    for (const a of assignments) {
      const list = map.get(a.nodeId) ?? [];
      list.push(a);
      map.set(a.nodeId, list);
    }
    return map;
  }, [assignments]);

  const filled = DOSSIER_ORDER.filter((id) => (byNode.get(id)?.length ?? 0) > 0).length;
  const total = DOSSIER_ORDER.length;
  const highCount = suggestions.filter((s) => s.confidence === 'HIGH').length;

  const orientRows = useMemo(() => {
    const row = (
      q: string,
      nodeId: KnowledgeNodeId,
      emptyHint: string,
    ) => {
      const hit = firstText(byNode, suggestions, nodeId);
      return {
        q,
        nodeId,
        value: hit?.text ?? null,
        pageNumber: hit?.pageNumber,
        pending: hit?.pending ?? false,
        emptyHint,
      };
    };
    return [
      row('Đây là gì?', 'trich-yeu', 'Chưa rõ — mở Bằng chứng hoặc Ghi tay'),
      row('Số / loại?', 'so-van-ban', 'Chưa có số VB (không đoán từ V/v)'),
      row('Phải làm gì?', 'yeu-cau', 'Chưa thấy yêu cầu'),
      row('Hạn?', 'thoi-han', 'Chưa thấy thời hạn'),
      row('Ai ký?', 'nguoi-ky', 'Chưa thấy người ký'),
      row('Ai nhận / phối hợp?', 'noi-nhan', 'Chưa rõ nơi nhận'),
      row('VB liên quan / thay thế?', 'van-ban-lien-quan', 'Chưa thấy liên quan'),
    ];
  }, [byNode, suggestions]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--panel)]">
      <div className="border-b border-[var(--border)] px-3 py-2">
        <h2 className="text-sm font-semibold text-[var(--fg)]">Bàn làm việc</h2>
        {documentTitle ? (
          <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]" title={documentTitle}>
            {documentTitle}
          </p>
        ) : null}
        <p className="mt-1 text-[10px] leading-snug text-[var(--muted)]">
          Trả lời «việc gì tiếp theo?» trong ~30 giây. PDF chỉ là bằng chứng — Gợi ý → Nhận · sai thì
          Sửa · Lưu.
          {contentOnly ? ' Đang ẩn chrome trên bằng chứng.' : ' Đang xem đủ lớp trên bằng chứng.'}
        </p>
        {!evidenceOpen ? (
          <div className="mt-2 rounded border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-2 py-1.5">
            <p className="text-[11px] font-medium text-[var(--fg)]">
              Đây là Bàn làm việc mới — PDF không còn chiếm giữa màn hình.
            </p>
            <button
              type="button"
              className="orc-btn orc-btn-primary mt-1.5 !px-2 !py-0.5 !text-[11px]"
              onClick={onOpenEvidence}
            >
              Mở bằng chứng (PDF)
            </button>
          </div>
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-[#edebe9]">
            <div
              className="h-full bg-[var(--accent)] transition-[width]"
              style={{ width: `${Math.round((filled / total) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-[10px] text-[var(--muted)]">
            {filled}/{total}
          </span>
          <button
            type="button"
            className="orc-btn orc-btn-primary !px-2 !py-0.5 !text-[10px]"
            disabled={!dirty || saving}
            onClick={onSave}
          >
            {saving ? '…' : 'Lưu'}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {textStatus === 'empty' ? (
          <section className="border-b border-[#c8c6c4] bg-[#fff4ce] px-3 py-2">
            <p className="text-[11px] font-medium text-[var(--fg)]">
              Không đọc được chữ trên trang bằng chứng
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-[var(--muted)]">
              Ghi việc thủ công bên dưới. Không đoán nội dung giúp bạn. Cần bản có chữ nhúng hoặc
              nguồn chữ được bật sau.
            </p>
          </section>
        ) : null}

        <section className="border-b border-[var(--border)] px-2 py-2">
          <p className="mb-1.5 px-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            Định hướng 30 giây
          </p>
          <ul className="space-y-1">
            {orientRows.map((r) => (
              <li key={r.q} className="rounded px-1.5 py-1 hover:bg-[var(--bg)]">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      if (r.pageNumber && onLocateEvidence) {
                        onLocateEvidence(r.pageNumber);
                      }
                      onArmNode(r.nodeId);
                    }}
                  >
                    <span className="block text-[10px] text-[var(--muted)]">{r.q}</span>
                    {r.value ? (
                      <span className="mt-0.5 block text-[12px] leading-snug text-[var(--fg)]">
                        {r.value}
                        {r.pending ? (
                          <span className="ml-1 text-[10px] text-[var(--accent)]">(gợi ý)</span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-[11px] italic text-[var(--muted)]">
                        {r.emptyHint}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="orc-btn shrink-0 !px-1.5 !py-0 !text-[10px]"
                    title="Ghi tay trường này"
                    onClick={() => onArmNode(r.nodeId)}
                  >
                    Ghi
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {peeledChrome.length > 0 ? (
          <section className="border-b border-[var(--border)] px-2 py-1.5">
            <p className="mb-1 px-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Đã bóc khỏi trang ({peeledChrome.length})
            </p>
            <ul className="space-y-1">
              {peeledChrome.map((p) => (
                <li
                  key={p.id}
                  className="rounded px-1.5 py-1 text-[10px] text-[var(--muted)]"
                >
                  <span className="font-medium text-[var(--fg)]">{p.labelVi}</span>
                  <span className="ml-1">p.{p.pageNumber}</span>
                  <span className="mt-0.5 block line-clamp-2 text-[var(--fg)]">{p.text}</span>
                  {p.saveToKnowledge ? (
                    <span className="text-[var(--accent)]">
                      → có trong Gợi ý (ghi nguồn bản nếu Nhận)
                    </span>
                  ) : (
                    <span>Ẩn để chọn nội dung — không đưa vào thư viện thao tác</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="border-b border-[var(--border)] px-2 py-1.5">
          <div className="mb-1 flex items-center gap-1 px-1">
            <p className="min-w-0 flex-1 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Gợi ý ({suggestions.length})
            </p>
            <button
              type="button"
              className="orc-btn !px-1.5 !py-0 !text-[10px]"
              title="Quét lại chữ đã đọc trên các trang"
              onClick={onRefreshSuggestions}
            >
              Quét lại
            </button>
            {highCount > 0 ? (
              <button
                type="button"
                className="orc-btn orc-btn-primary !px-1.5 !py-0 !text-[10px]"
                title="Chỉ nhận các gợi ý độ tin cậy cao — vẫn là xác nhận của bạn"
                onClick={onAcceptAllHigh}
              >
                Nhận cao ({highCount})
              </button>
            ) : null}
          </div>
          {suggestions.length === 0 ? (
            <p className="px-1 text-[10px] text-[var(--muted)]">
              Chưa có gợi ý — mở/đổi trang để đọc chữ, rồi Quét lại. Ô trống vẫn Ghi tay.
            </p>
          ) : (
            <ul className="space-y-1">
              {suggestions.map((s) => {
                const label =
                  KNOWLEDGE_NODES.find((n) => n.id === s.nodeId)?.label ?? s.nodeId;
                return (
                  <li
                    key={s.id}
                    className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-1"
                  >
                    <div className="flex items-center gap-1">
                      <span className="min-w-0 flex-1 font-medium text-[var(--fg)]">
                        {label}
                        <span className="ml-1 text-[10px] font-normal text-[var(--muted)]">
                          {s.confidence} · p.{s.pageNumber}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="orc-btn orc-btn-primary !px-1.5 !py-0 !text-[10px]"
                        title="Xác nhận đưa vào hồ sơ"
                        onClick={() => onAcceptSuggestion(s)}
                      >
                        Nhận
                      </button>
                      <button
                        type="button"
                        className="orc-btn !px-1.5 !py-0 !text-[10px]"
                        title="Bỏ gợi ý này"
                        onClick={() => onDismissSuggestion(s.id)}
                      >
                        Bỏ
                      </button>
                    </div>
                    {looksLikeMarkdownTable(s.text) ? (
                      <div className="mt-1">
                        <KnowledgeTableView text={s.text} maxRows={8} />
                      </div>
                    ) : (
                      <p className="mt-0.5 line-clamp-3 text-[11px] text-[var(--fg)]">{s.text}</p>
                    )}
                    <p className="text-[10px] text-[var(--muted)]">{s.reason}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <ul className="space-y-0 px-2 py-1 text-[11px]">
          {DOSSIER_ORDER.map((nodeId) => {
            const node = KNOWLEDGE_NODES.find((n) => n.id === nodeId);
            if (!node) {
              return null;
            }
            const items = byNode.get(nodeId) ?? [];
            const primary = items[0];
            const armed = activeNodeId === nodeId;
            const isEditing = primary && editingId === primary.id;
            const pendingAll = suggestions.filter((s) => s.nodeId === nodeId);
            const pending = pendingAll[0];

            return (
              <li
                key={nodeId}
                className={`border-b border-[var(--border)]/80 px-1 py-1.5 ${
                  armed ? 'bg-[#deecf9]/70' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ background: node.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 font-medium text-[var(--fg)]">{node.label}</span>
                  {!primary ? (
                    <>
                      {pending ? (
                        <button
                          type="button"
                          className="orc-btn orc-btn-primary !px-1.5 !py-0 !text-[10px]"
                          onClick={() => onAcceptSuggestion(pending)}
                        >
                          Nhận
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="orc-btn !px-1.5 !py-0 !text-[10px]"
                        title="Chọn ô này rồi bôi chữ trên văn bản"
                        onClick={() => onArmNode(nodeId)}
                      >
                        Ghi
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="orc-btn !px-1.5 !py-0 !text-[10px]"
                        title="Tới chỗ đã ghi trên văn bản"
                        onClick={() => onOpenAssignment(primary)}
                      >
                        Xem
                      </button>
                      <button
                        type="button"
                        className="orc-btn !px-1.5 !py-0 !text-[10px]"
                        title="Sửa nội dung kiến thức (thư viện)"
                        onClick={() => {
                          setEditingId(primary.id);
                          setDraft(primary.text);
                        }}
                      >
                        Sửa
                      </button>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-1 space-y-1 pl-3.5">
                    <textarea
                      className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-1 text-[11px] text-[var(--fg)]"
                      rows={3}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      aria-label={`Sửa ${node.label}`}
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="orc-btn orc-btn-primary !px-1.5 !py-0 !text-[10px]"
                        onClick={() => {
                          onUpdateAssignmentText(primary.id, draft.trim());
                          setEditingId(null);
                        }}
                      >
                        Xong
                      </button>
                      <button
                        type="button"
                        className="orc-btn !px-1.5 !py-0 !text-[10px]"
                        onClick={() => setEditingId(null)}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : primary ? (
                  <div className="mt-0.5 w-full pl-3.5 text-left text-[var(--fg)]">
                    {looksLikeMarkdownTable(primary.text) || nodeId === 'bieu-mau' ? (
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => onOpenAssignment(primary)}
                      >
                        <KnowledgeTableView text={primary.text} maxRows={10} />
                        <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                          {primary.source === 'auto' ? 'đã nhận gợi ý · ' : ''}
                          p.{primary.pageNumber}
                          {items.length > 1 ? ` · +${items.length - 1} bảng` : ''}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => onOpenAssignment(primary)}
                      >
                        <span className="line-clamp-3">{primary.text}</span>
                        <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                          {primary.source === 'auto' ? 'đã nhận gợi ý · ' : ''}
                          p.{primary.pageNumber}
                          {items.length > 1 ? ` · +${items.length - 1}` : ''}
                        </span>
                      </button>
                    )}
                  </div>
                ) : pendingAll.length > 0 ? (
                  <p className="mt-0.5 line-clamp-2 pl-3.5 text-[10px] text-[var(--muted)]">
                    {pendingAll.length > 1
                      ? `${pendingAll.length} gợi ý tách (mỗi căn cứ một VB) — Nhận từng cái phía trên`
                      : `Gợi ý: ${pending?.text}`}
                  </p>
                ) : (
                  <p className="mt-0.5 pl-3.5 text-[10px] text-[var(--muted)]">
                    Chưa ghi · Ghi tay hoặc chờ gợi ý
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <p className="border-t border-[var(--border)] px-3 py-1.5 text-[10px] text-[var(--muted)]">
        Nhận = bạn xác nhận. Không tự ghi thư viện khi chưa bấm.
      </p>
    </div>
  );
}
