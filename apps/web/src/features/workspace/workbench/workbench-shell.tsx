'use client';

import { useCallback, useRef, type ReactNode } from 'react';

type Props = {
  leftOpen: boolean;
  rightOpen: boolean;
  leftWidth: number;
  rightWidth: number;
  onLeftWidth: (w: number) => void;
  onRightWidth: (w: number) => void;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

function ResizeHandle({
  onDrag,
  edge,
}: {
  onDrag: (clientX: number) => void;
  edge: 'left' | 'right';
}) {
  const dragging = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) {
        return;
      }
      onDrag(e.clientX);
    },
    [onDrag],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={edge === 'left' ? 'Đổi kích thước mục lục' : 'Đổi kích thước panel phải'}
      className="orc-resize-handle group relative z-10 w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-[var(--accent)]/30"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="pointer-events-none absolute inset-y-0 -left-0.5 w-2" />
    </div>
  );
}

export function WorkbenchShell({
  leftOpen,
  rightOpen,
  leftWidth,
  rightWidth,
  onLeftWidth,
  onRightWidth,
  left,
  center,
  right,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);

  const dragLeft = useCallback(
    (clientX: number) => {
      const rect = shellRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      onLeftWidth(clientX - rect.left);
    },
    [onLeftWidth],
  );

  const dragRight = useCallback(
    (clientX: number) => {
      const rect = shellRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      onRightWidth(rect.right - clientX);
    },
    [onRightWidth],
  );

  return (
    <div ref={shellRef} className="flex min-h-0 flex-1">
      {leftOpen ? (
        <>
          <aside
            className="flex h-full min-h-0 shrink-0 flex-col border-r border-[var(--border)]"
            style={{ width: leftWidth }}
          >
            {left}
          </aside>
          <ResizeHandle edge="left" onDrag={dragLeft} />
        </>
      ) : null}

      <main className="min-w-0 flex-1">{center}</main>

      {rightOpen ? (
        <>
          <ResizeHandle edge="right" onDrag={dragRight} />
          <aside
            className="flex h-full min-h-0 shrink-0 flex-col border-l border-[var(--border)] bg-[var(--panel)]"
            style={{ width: rightWidth }}
          >
            {right}
          </aside>
        </>
      ) : null}
    </div>
  );
}
