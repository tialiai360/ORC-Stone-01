/**
 * Shared workbench view modes — single source for mode bars.
 * UX-001 highlighter bindings are unrelated and unchanged.
 */

import type { WorkspaceViewMode } from '../pdf/plugins/types';

export type WorkbenchModeDef = {
  id: WorkspaceViewMode;
  label: string;
  title: string;
};

export const WORKBENCH_MODES: readonly WorkbenchModeDef[] = [
  { id: 'reading', label: 'Đọc', title: 'Đọc — chỉ nội dung văn bản (mặc định khi mở)' },
  { id: 'normal', label: 'Thường', title: 'Thường — hiện mọi lớp đã nhận' },
  { id: 'authoring', label: 'Soạn', title: 'Soạn — nhấn mạnh cấu trúc' },
  { id: 'review', label: 'Duyệt', title: 'Duyệt — hiện lớp thẩm quyền' },
  { id: 'focus', label: 'Focus', title: 'Focus — tối đa vùng tài liệu' },
] as const;
