import type {
  ClassifiedObject,
  ObjectCapability,
  ObjectDiagnostics,
  ObjectRelation,
} from './types';

export function buildRelations(objects: ClassifiedObject[]): ObjectRelation[] {
  const relations: ObjectRelation[] = [];
  let n = 0;
  const footerish = objects.filter(
    (o) => o.class === 'signature' || o.class === 'seal' || o.class === 'stamp',
  );
  const footerRegion = objects.filter((o) => o.class === 'footer');
  for (const sig of footerish) {
    const host =
      footerRegion.find((f) => Math.abs(f.bbox.y - sig.bbox.y) < 120) ?? footerRegion[0];
    if (host) {
      relations.push({
        id: `rel-${n++}`,
        type: 'belongs-to',
        fromId: sig.id,
        toId: host.id,
        reasons: ['same-footer-band'],
      });
    }
  }

  // Near neighbors (vertical stack)
  const sorted = [...objects]
    .filter((o) => o.textItemIds.length > 0)
    .sort((a, b) => a.bbox.y - b.bbox.y || a.bbox.x - b.bbox.x);
  for (let i = 1; i < sorted.length; i += 1) {
    const a = sorted[i - 1]!;
    const b = sorted[i]!;
    if (b.bbox.y - (a.bbox.y + a.bbox.h) < 24) {
      relations.push({
        id: `rel-${n++}`,
        type: 'below',
        fromId: b.id,
        toId: a.id,
        reasons: ['vertical-proximity'],
      });
    }
  }
  return relations.slice(0, 400);
}

export function buildObjectDiagnostics(
  objects: ClassifiedObject[],
  totalPrimitives: number,
  detectorCount: number,
): ObjectDiagnostics {
  const byClass: ObjectDiagnostics['byClass'] = {};
  let unknown = 0;
  for (const o of objects) {
    byClass[o.class] = (byClass[o.class] ?? 0) + 1;
    if (o.class === 'unknown') {
      unknown += 1;
    }
  }
  const recognized = objects.length - unknown;
  const coverage =
    totalPrimitives > 0 ? Math.round((recognized / totalPrimitives) * 1000) / 10 : 0;
  const notes: string[] = [];
  if (unknown > objects.length * 0.4) {
    notes.push('High unknown object ratio');
  }
  return {
    totalPrimitives,
    totalObjects: objects.length,
    recognizedObjects: recognized,
    unknownObjects: unknown,
    objectCoverage: coverage,
    byClass,
    detectorCount,
    notes,
  };
}

export function buildObjectCapabilities(objects: ClassifiedObject[]): ObjectCapability[] {
  const has = (cls: ClassifiedObject['class']) => objects.some((o) => o.class === cls);
  return [
    { id: 'ocap-text', labelVi: 'Lớp chữ', present: has('body-text') || has('heading'), objectClass: 'body-text' },
    { id: 'ocap-header', labelVi: 'Đầu trang', present: has('header') || has('title'), objectClass: 'header' },
    { id: 'ocap-footer', labelVi: 'Cuối trang', present: has('footer'), objectClass: 'footer' },
    { id: 'ocap-table', labelVi: 'Bảng', present: has('table'), objectClass: 'table' },
    { id: 'ocap-image', labelVi: 'Hình ảnh', present: has('photo') || has('icon'), objectClass: 'photo' },
    { id: 'ocap-watermark', labelVi: 'Watermark', present: has('watermark'), objectClass: 'watermark' },
    { id: 'ocap-signature', labelVi: 'Chữ ký', present: has('signature'), objectClass: 'signature' },
    { id: 'ocap-seal', labelVi: 'Con dấu', present: has('seal') || has('stamp'), objectClass: 'seal' },
    { id: 'ocap-qr', labelVi: 'Mã QR', present: has('qr-code'), objectClass: 'qr-code' },
    { id: 'ocap-barcode', labelVi: 'Mã vạch', present: has('barcode'), objectClass: 'barcode' },
    {
      id: 'ocap-annotation',
      labelVi: 'Chú thích PDF',
      present: has('annotation'),
      objectClass: 'annotation',
    },
    { id: 'ocap-appendix', labelVi: 'Phụ lục', present: has('appendix'), objectClass: 'appendix' },
    { id: 'ocap-attachment', labelVi: 'Đính kèm', present: has('attachment'), objectClass: 'attachment' },
  ];
}
