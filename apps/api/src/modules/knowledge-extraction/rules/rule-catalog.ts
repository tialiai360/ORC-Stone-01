/**
 * Deterministic extraction rule catalog — single source of patterns.
 * No NLP / AI / semantic inference.
 */

export const RULE_CATALOG = {
  version: '1.0.0',
  documentNumber: [
    /(?:^|\n)\s*(?:Số|So|No\.?|Number)\s*[:：]\s*([A-ZÀ-Ỹ0-9][A-ZÀ-Ỹ0-9\/\-\.]*)/gim,
  ],
  documentDate: [
    /(?:^|\n)\s*(?:Ngày|Ngay|Date)\s*[:：]\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/gim,
  ],
  documentTitle: [
    /(?:^|\n)\s*(?:Về|Ve|Subject|Title|Re)\s*[:：]\s*(.+)$/gim,
  ],
  issuer: [
    /(?:^|\n)\s*(?:Cơ quan ban hành|Co quan ban hanh|Issuer|Ban hành bởi|Ban hanh boi)\s*[:：]\s*(.+)$/gim,
  ],
  documentTypeKeywords: [
    'quyet dinh',
    'quyết định',
    'thong bao',
    'thông báo',
    'cong van',
    'công văn',
    'notice',
    'decision',
    'circular',
    'directive',
  ],
  referencedDocuments: [
    /(?:căn cứ|can cu|theo|tham chiếu|tham chieu|ref(?:erence)?(?:\s+to)?|pursuant to)\s+([^\s,]{3,})/gim,
  ],  effectiveDate: [
    /(?:hiệu lực|hieu luc|effective(?:\s+date)?)\s*[:：]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/gim,
  ],
  departments: [
    /(?:phòng|phong|ban|department)\s+([A-Za-zÀ-ỹ0-9][A-Za-zÀ-ỹ0-9\s\-]{1,60})/gim,
  ],
  responsibleUnits: [
    /(?:đơn vị thực hiện|don vi thuc hien|responsible\s*units?|chịu trách nhiệm|chiu trach nhiem)\s*[:：]\s*(.+)$/gim,
  ],
  actionStatements: [
    /(?:^|\n)\s*(?:[-*•]\s*)?(?:phải|phai|shall|must|yêu cầu|yeu cau|thực hiện|thuc hien)\s+.+$/gim,
  ],
  deadlines: [
    /(?:trước ngày|truoc ngay|deadline|hạn|han|no later than)\s*[:：]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/gim,
  ],
  priorityIndicators: [
    /\b(?:khẩn|khan|hoả tốc|hoa toc|urgent|priority|cao)\b/gim,
  ],
  appendices: [
    /(?:phụ lục|phu luc|appendix|annex)\s*([A-Z0-9\-]+)?/gim,
  ],
  headingLine: /^(?:\d+(?:\.\d+)*[\.\)]\s+\S.+|[A-ZĐ][A-ZĐ\s]{2,80})$/gm,
  numberedHeading: /^(\d+(?:\.\d+)*[\.\)]\s+.+)$/gm,
  logicalTableRow: /^(?:.+\|.+|.+\t.+\t.+)$/gm,
} as const;

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter((v) => v.length > 0))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function firstMatch(text: string, patterns: readonly RegExp[]): string | null {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

export function allMatches(text: string, patterns: readonly RegExp[], group = 1): string[] {
  const found: string[] = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const value = (match[group] ?? match[0]).trim();
      if (value) {
        found.push(value);
      }
      if (!pattern.global) {
        break;
      }
    }
  }
  return uniqueSorted(found);
}
