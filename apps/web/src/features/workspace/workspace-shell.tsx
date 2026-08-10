'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const CongVanDeskPage = dynamic(
  () => import('../cong-van-desk/cong-van-desk-page').then((m) => m.CongVanDeskPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-[#f3f2f1] text-sm text-[#605e5c]">
        Đang mở bàn làm việc…
      </div>
    ),
  },
);

const WorkspacePage = dynamic(
  () => import('./workspace-page').then((m) => m.WorkspacePage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-[#f3f2f1] text-sm text-[#605e5c]">
        Đang mở lab…
      </div>
    ),
  },
);

type WorkspaceShellProps = {
  documentId: string;
};

/** Default = Clean Desk (PDR-007). Legacy lab = `?lab=1`. */
export function WorkspaceShell({ documentId }: WorkspaceShellProps) {
  const search = useSearchParams();
  const lab = search.get('lab') === '1';

  if (lab) {
    return <WorkspacePage documentId={documentId} />;
  }
  return <CongVanDeskPage documentId={documentId} />;
}
