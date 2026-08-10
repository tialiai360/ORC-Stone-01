/**
 * Workbench audience — who the chrome is for.
 * Additive UX layer; does not change engine / Knowledge / Evidence schemas.
 */

export type WorkbenchAudience = 'user' | 'developer';

export const AUDIENCE_STORAGE_KEY = 'orc.workbench.audience.v2';

export const AUDIENCE_LABELS: Record<
  WorkbenchAudience,
  { label: string; title: string; hint: string }
> = {
  user: {
    label: 'Người dùng',
    title: 'Bàn làm việc — việc gì tiếp theo?',
    hint: 'Định hướng 30s → Nhận Knowledge → Lưu. PDF = bằng chứng.',
  },
  developer: {
    label: 'Lập trình',
    title: 'Đầy đủ lớp nhận diện / cấu trúc / chẩn đoán',
    hint: 'Toàn bộ panel kỹ thuật: năng lực, đối tượng DOI, cấu trúc, bản đồ, Diag.',
  },
};

/** Status-line hint for user mode — reflects current view mode. */
export function userGuideHint(contentOnly: boolean): string {
  if (contentOnly) {
    return 'Bàn làm việc: Định hướng → Gợi ý → Nhận · Sửa · Lưu. Bằng chứng (PDF) bên phải. Chỉ nội dung đang ẩn chrome.';
  }
  return 'Bàn làm việc trung tâm; Bằng chứng bên phải. «Chỉ nội dung» để đọc sạch khi bôi chữ.';
}
