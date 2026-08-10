'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ClassificationAssignment, KNOWLEDGE_NODES } from '@orc/shared';
import { computeKnowledgeProgress } from './knowledge-progress';

type TabId = 'progress' | 'tree' | 'missing';

type Props = {
  assignments: ClassificationAssignment[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  flashNodeId: string | null;
  focusedAssignmentId: string | null;
  onSelectAssignment: (assignment: ClassificationAssignment) => void;
  evidenceCount: number;
  dirty: boolean;
  reviewHint?: string;
};

export function KnowledgeWorkspace({
  assignments,
  selectedNodeId,
  onSelectNode,
  flashNodeId,
  focusedAssignmentId,
  onSelectAssignment,
  evidenceCount,
  dirty,
  reviewHint,
}: Props) {
  const [tab, setTab] = useState<TabId>('progress');
  const focusRef = useRef<HTMLLIElement | null>(null);
  const progress = useMemo(() => computeKnowledgeProgress(assignments), [assignments]);

  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedAssignmentId, selectedNodeId]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--panel)]">
      <div className="border-b border-[var(--border)] px-3 py-1.5">
        <h2 className="text-sm font-semibold text-[var(--fg)]">Không gian kiến thức</h2>
        <p className="text-[10px] text-[var(--muted)]">
          Tiến độ · thiếu sót · ánh xạ (không tự động)
        </p>
        <div className="mt-1.5 flex gap-1" role="tablist" aria-label="Kiến thức">
          {(
            [
              ['progress', 'Tiến độ'],
              ['missing', 'Thiếu'],
              ['tree', 'Ánh xạ'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`orc-btn !px-2 !py-0.5 !text-[10px] ${tab === id ? 'orc-btn-primary' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'progress' ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 py-2 text-[11px]">
          <div className="mb-2">
            <div className="mb-1 flex justify-between text-[var(--muted)]">
              <span>Phủ kiến thức</span>
              <span className="tabular-nums">
                {progress.mappedNodes}/{progress.totalNodes}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-sm bg-[#edebe9]">
              <div
                className="h-full bg-[var(--accent)] transition-[width]"
                style={{ width: `${Math.round(progress.coverageRatio * 100)}%` }}
              />
            </div>
          </div>
          <ul className="space-y-1 text-[var(--fg)]">
            <li className="flex justify-between">
              <span>Đoạn đã gán</span>
              <span className="tabular-nums">{progress.assignmentCount}</span>
            </li>
            <li className="flex justify-between">
              <span>Thủ công / gợi ý</span>
              <span className="tabular-nums">
                {progress.manualCount} / {progress.autoCount}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Evidence</span>
              <span className="tabular-nums">{evidenceCount}</span>
            </li>
            <li className="flex justify-between">
              <span>Trạng thái phiên</span>
              <span>{dirty ? 'Chưa lưu' : 'Đã lưu'}</span>
            </li>
            <li className="flex justify-between">
              <span>Review</span>
              <span>{reviewHint ?? 'Chưa xuất gói'}</span>
            </li>
          </ul>
          <p className="mt-3 text-[10px] text-[var(--muted)]">
            Checklist: tô màu → xác nhận Similar thủ công → lưu → xuất Review khi cần.
          </p>
        </div>
      ) : null}

      {tab === 'missing' ? (
        <ul className="min-h-0 flex-1 overflow-auto py-1 text-[11px]">
          {progress.missingNodeIds.length === 0 ? (
            <li className="px-3 py-2 text-[var(--muted)]">Đủ node đã có ít nhất một đoạn.</li>
          ) : (
            progress.missingNodeIds.map((id) => {
              const node = KNOWLEDGE_NODES.find((n) => n.id === id);
              if (!node) {
                return null;
              }
              return (
                <li key={id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--bg)]"
                    onClick={() => {
                      setTab('tree');
                      onSelectNode(id);
                    }}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: node.color }}
                    />
                    <span>{node.label}</span>
                    <span className="ml-auto text-[10px] text-[var(--muted)]">Thiếu</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {tab === 'tree' ? (
        <ul className="min-h-0 flex-1 overflow-auto py-0.5 text-sm">
          {KNOWLEDGE_NODES.map((node) => {
            const items = assignments.filter((a) => a.nodeId === node.id);
            const active = selectedNodeId === node.id;
            const flash = flashNodeId === node.id;
            return (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => onSelectNode(node.id)}
                  className={`flex w-full items-start gap-2 px-3 py-1.5 text-left transition-colors ${
                    active ? 'bg-[#deecf9]' : 'hover:bg-[var(--bg)]'
                  } ${flash ? 'ring-2 ring-inset ring-[var(--accent)]' : ''}`}
                >
                  <span
                    className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: node.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--fg)]">{node.label}</span>
                    <span className="block text-[11px] text-[var(--muted)]">
                      {items.length === 0
                        ? 'Chưa có nội dung'
                        : `${items.length} đoạn${items.some((i) => i.source === 'auto') ? ' · gợi ý' : ''}`}
                    </span>
                  </span>
                </button>
                {active && items.length > 0 ? (
                  <ul className="ml-3 space-y-1 border-l-2 border-[var(--border)] bg-[var(--panel-soft)] px-2.5 py-1.5">
                    {items.map((item) => {
                      const focused = focusedAssignmentId === item.id;
                      return (
                        <li
                          key={item.id}
                          ref={focused ? focusRef : undefined}
                          className={`cursor-pointer rounded border bg-white px-2 py-1 text-[11px] text-[var(--fg)] ${
                            focused
                              ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]'
                              : 'border-[#edebe9]'
                          }`}
                          style={{ borderLeft: `3px solid ${node.color}` }}
                          onClick={() => onSelectAssignment(item)}
                        >
                          <p className="line-clamp-3 whitespace-pre-wrap">{item.text}</p>
                          <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                            Trang {item.pageNumber}
                            {item.structureRef?.dpkClass
                              ? ` · ${item.structureRef.dpkClass}`
                              : ''}
                            {item.structureRef?.objectClass
                              ? ` · obj:${item.structureRef.objectClass}`
                              : ''}
                            {item.source === 'auto' ? ' · ORC' : ' · thủ công'}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
