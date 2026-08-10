import { randomUUID } from 'node:crypto';
import {
  ClassificationAssignment,
  KnowledgeExtractionResult,
} from '@orc/shared';

/** Map deterministic extraction payload into default knowledge nodes (page 1). */
export function seedAssignmentsFromExtraction(
  extraction: KnowledgeExtractionResult,
): ClassificationAssignment[] {
  const now = new Date().toISOString();
  const out: ClassificationAssignment[] = [];
  const pageNumber = 1;
  const meta = extraction.payload.metadata;

  const push = (nodeId: string, text: string | null | undefined) => {
    const value = text?.trim();
    if (!value) {
      return;
    }
    out.push({
      id: randomUUID(),
      nodeId,
      text: value,
      pageNumber,
      createdAt: now,
      source: 'auto',
    });
  };

  push('don-vi-ban-hanh', meta.issuer);
  push('loai-van-ban', meta.documentType);
  push('so-van-ban', meta.documentNumber);
  push('ngay-ban-hanh', meta.documentDate);
  push('hieu-luc', meta.effectiveDate);
  push('trich-yeu', meta.documentTitle);

  for (const unit of extraction.payload.responsibleUnits) {
    push('doi-tuong', unit);
  }
  for (const dept of extraction.payload.departments) {
    push('doi-tuong', dept);
  }
  for (const action of extraction.payload.actionStatements) {
    push('yeu-cau', action);
  }
  for (const deadline of extraction.payload.deadlines) {
    push('thoi-han', deadline);
  }
  for (const appendix of extraction.payload.appendices) {
    push('bieu-mau', appendix.label);
  }
  for (const ref of extraction.payload.referencedDocuments) {
    push('van-ban-lien-quan', ref);
  }
  for (const section of extraction.payload.sections.slice(0, 8)) {
    const heading = section.heading.toLowerCase();
    if (heading.includes('căn cứ') || heading.includes('can cu')) {
      push('can-cu', `${section.heading}\n${section.body}`.trim());
    } else if (heading.includes('nơi nhận') || heading.includes('noi nhan')) {
      push('noi-nhan', `${section.heading}\n${section.body}`.trim());
    } else {
      push('noi-dung', `${section.heading}\n${section.body}`.trim());
    }
  }

  return out;
}
