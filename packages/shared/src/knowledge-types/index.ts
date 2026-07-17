/**
 * Knowledge Extraction shared types (MVP-003).
 * Deterministic rule-based extraction only — no AI/LLM/OCR/NLP.
 */

export const EXTRACTION_VERSION = '1.0.0' as const;
export const RULE_VERSION = '1.0.0' as const;

export interface ExtractedDocumentMetadata {
  documentNumber: string | null;
  documentDate: string | null;
  documentTitle: string | null;
  issuer: string | null;
  documentType: string | null;
  effectiveDate: string | null;
}

export interface ExtractedSection {
  heading: string;
  startOffset: number;
  endOffset: number;
  /** Raw section body text — no interpretation. */
  body: string;
}

export interface ExtractedAppendix {
  label: string;
  offset: number;
}

export interface ExtractedLogicalTable {
  /** Row texts detected by delimiter heuristics only. */
  rows: string[];
  startOffset: number;
}

export interface KnowledgeExtractionPayload {
  metadata: ExtractedDocumentMetadata;
  referencedDocuments: string[];
  departments: string[];
  responsibleUnits: string[];
  actionStatements: string[];
  deadlines: string[];
  priorityIndicators: string[];
  appendices: ExtractedAppendix[];
  sections: ExtractedSection[];
  logicalTables: ExtractedLogicalTable[];
  headings: string[];
}

export interface KnowledgeExtractionResult {
  id: string;
  documentId: string;
  extractionVersion: typeof EXTRACTION_VERSION | string;
  ruleVersion: typeof RULE_VERSION | string;
  createdAt: string;
  payload: KnowledgeExtractionPayload;
  /** Count of extracted atomic values (scalars present + array items). */
  extractionCount: number;
}

export function countExtractionItems(payload: KnowledgeExtractionPayload): number {
  const meta = payload.metadata;
  const scalarCount = [
    meta.documentNumber,
    meta.documentDate,
    meta.documentTitle,
    meta.issuer,
    meta.documentType,
    meta.effectiveDate,
  ].filter((v) => v != null && String(v).length > 0).length;

  return (
    scalarCount +
    payload.referencedDocuments.length +
    payload.departments.length +
    payload.responsibleUnits.length +
    payload.actionStatements.length +
    payload.deadlines.length +
    payload.priorityIndicators.length +
    payload.appendices.length +
    payload.sections.length +
    payload.logicalTables.length +
    payload.headings.length
  );
}
