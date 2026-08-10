import { Suspense } from 'react';
import { WorkspaceShell } from '../../../features/workspace/workspace-shell';

type PageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function WorkspaceRoute({ params }: PageProps) {
  const { documentId } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f3f2f1] text-sm text-[#605e5c]">
          Đang mở bàn làm việc…
        </div>
      }
    >
      <WorkspaceShell documentId={documentId} />
    </Suspense>
  );
}
