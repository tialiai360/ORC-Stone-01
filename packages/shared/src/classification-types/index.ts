/**
 * WAVE-01 / UX-001 — Knowledge mapping types + locked colors.
 * Vietnamese knowledge tree for HO Notice Assistant.
 */

export const CLASSIFICATION_VERSION = '1.0.0' as const;

export interface KnowledgeNodeDef {
  id: string;
  label: string;
  /** Locked CSS color — user cannot redefine. */
  color: string;
  /** Ctrl+digit shortcut when set (1–9). */
  shortcutDigit?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
}

/**
 * Fixed Vietnamese knowledge tree + locked colors (UX-001).
 * Shortcut pens: Ctrl+1…Ctrl+9.
 */
export const KNOWLEDGE_NODES: readonly KnowledgeNodeDef[] = [
  { id: 'thong-tin-van-ban', label: 'Thông tin văn bản', color: '#5B9BD5' },
  {
    id: 'don-vi-ban-hanh',
    label: 'Đơn vị ban hành',
    color: '#2B6CB0', // xanh dương
    shortcutDigit: '1',
  },
  { id: 'loai-van-ban', label: 'Loại văn bản', color: '#3182CE' },
  {
    id: 'so-van-ban',
    label: 'Số văn bản',
    color: '#38A169', // xanh lá
    shortcutDigit: '2',
  },
  { id: 'ngay-ban-hanh', label: 'Ngày ban hành', color: '#DD6B20' },
  { id: 'hieu-luc', label: 'Hiệu lực', color: '#2C7A7B' },
  {
    id: 'trich-yeu',
    label: 'Trích yếu',
    color: '#805AD5', // tím
    shortcutDigit: '3',
  },
  {
    id: 'doi-tuong',
    label: 'Đối tượng',
    color: '#718096', // xám
    shortcutDigit: '5',
  },
  {
    id: 'can-cu',
    label: 'Căn cứ',
    color: '#DD6B20', // cam
    shortcutDigit: '4',
  },
  { id: 'noi-dung', label: 'Nội dung', color: '#4A5568' },
  {
    id: 'yeu-cau',
    label: 'Yêu cầu',
    color: '#E53E3E', // đỏ
    shortcutDigit: '6',
  },
  {
    id: 'thoi-han',
    label: 'Thời hạn',
    color: '#D69E2E', // vàng
    shortcutDigit: '7',
  },
  {
    id: 'bieu-mau',
    label: 'Biểu mẫu',
    color: '#D53F8C', // hồng
    shortcutDigit: '8',
  },
  { id: 'noi-nhan', label: 'Nơi nhận', color: '#2B6CB0' },
  { id: 'nguoi-ky', label: 'Người ký', color: '#1A202C' },
  { id: 'van-ban-lien-quan', label: 'Văn bản liên quan', color: '#C05621' },
  {
    id: 'khac',
    label: 'Khác',
    color: '#1A202C', // đen
    shortcutDigit: '9',
  },
] as const;

export type KnowledgeNodeId = (typeof KNOWLEDGE_NODES)[number]['id'];

export const SHORTCUT_PEN_NODES = KNOWLEDGE_NODES.filter(
  (n): n is KnowledgeNodeDef & { shortcutDigit: NonNullable<KnowledgeNodeDef['shortcutDigit']> } =>
    Boolean(n.shortcutDigit),
);

export function nodeByShortcutDigit(digit: string): KnowledgeNodeDef | undefined {
  return KNOWLEDGE_NODES.find((n) => n.shortcutDigit === digit);
}

export interface TextSpan {
  pageNumber: number;
  /** Selected plain text (from PDF text layer). */
  text: string;
}

/** Best-effort bind of a highlight to document structure (EVO-001 / EVO-002). */
export interface AssignmentStructureRef {
  blockId?: string;
  regionId?: string;
  moduleId?: string;
  /** DPK ontology class id when mapped. */
  dpkClass?: string;
  /** DOI object id when selection hits a classified object (additive). */
  objectId?: string;
  /** DOI object class (explainable). */
  objectClass?: string;
}

export interface ClassificationAssignment {
  id: string;
  nodeId: string;
  text: string;
  pageNumber: number;
  createdAt: string;
  /** true when seeded from automatic parsing */
  source?: 'auto' | 'manual';
  /** Structure / DPK binding when available at assign time. */
  structureRef?: AssignmentStructureRef;
}
export interface ClassificationSession {
  documentId: string;
  version: number;
  assignments: ClassificationAssignment[];
  updatedAt: string;
  reviewer: string;
  classificationVersion: typeof CLASSIFICATION_VERSION | string;
}

export interface StructureCorrectedEvidence {
  type: 'StructureCorrected';
  documentId: string;
  nodeId: string;
  before: string | null;
  after: string | null;
  timestamp: string;
  reviewer: string;
  version: number;
  /** Original node classification before override (UX-001). */
  originalClassification?: string | null;
  /** New node classification after override (UX-001). */
  newClassification?: string | null;
  /** Optional human reason. */
  reason?: string | null;
}
