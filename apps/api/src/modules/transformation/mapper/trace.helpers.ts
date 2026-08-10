import {
  KnowledgeExtractionResult,
  TracedField,
  TransformationTrace,
  TRANSFORM_RULE_VERSION,
} from '@orc/shared';

export function makeTrace(
  documentId: string,
  evidenceReference: string,
  section: string | null = null,
  paragraph: string | null = null,
): TransformationTrace {
  return {
    sourceDocumentId: documentId,
    section,
    paragraph,
    evidenceReference,
    ruleVersion: TRANSFORM_RULE_VERSION,
  };
}

export function traced<T>(
  value: T,
  documentId: string,
  evidenceReference: string,
  section: string | null = null,
  paragraph: string | null = null,
): TracedField<T> {
  return {
    value,
    trace: makeTrace(documentId, evidenceReference, section, paragraph),
  };
}

export function findSectionForText(
  extraction: KnowledgeExtractionResult,
  text: string,
): string | null {
  const hit = extraction.payload.sections.find(
    (s) => s.body.includes(text) || s.heading.includes(text),
  );
  return hit?.heading ?? null;
}
