import type { ObjectClass } from './types';

/** Vietnamese labels for DOI object classes (presentation only). */
export const OBJECT_CLASS_LABELS_VI: Record<ObjectClass, string> = {
  'body-text': 'Nội dung chữ',
  heading: 'Tiêu đề mục',
  title: 'Tiêu đề',
  subtitle: 'Phụ đề',
  logo: 'Logo',
  seal: 'Con dấu',
  signature: 'Chữ ký',
  'digital-signature': 'Chữ ký số',
  watermark: 'Watermark',
  'qr-code': 'Mã QR',
  barcode: 'Mã vạch',
  stamp: 'Dấu / stamp',
  table: 'Bảng',
  'table-border': 'Viền bảng',
  chart: 'Biểu đồ',
  diagram: 'Sơ đồ',
  photo: 'Hình ảnh',
  icon: 'Biểu tượng',
  footnote: 'Chú thích',
  header: 'Đầu trang',
  footer: 'Cuối trang',
  'margin-note': 'Ghi chú lề',
  annotation: 'Chú thích PDF',
  attachment: 'Đính kèm',
  appendix: 'Phụ lục',
  unknown: 'Chưa phân loại',
};

export function objectClassLabelVi(cls: string): string {
  return OBJECT_CLASS_LABELS_VI[cls as ObjectClass] ?? cls;
}
