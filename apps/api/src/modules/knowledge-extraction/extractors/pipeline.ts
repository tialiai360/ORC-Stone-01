import {
  KnowledgeExtractionPayload,
  countExtractionItems,
} from '@orc/shared';
import { extractAppendices, extractLogicalTables } from './appendix-table.extractor';
import { extractDeadlines } from './deadline.extractor';
import { extractHeadings } from './heading.extractor';
import {
  extractActionStatements,
  extractDepartments,
  extractPriorityIndicators,
} from './keyword.extractor';
import { extractMetadata } from './metadata.extractor';
import { extractReferencedDocuments } from './referenced-document.extractor';
import { extractResponsibleUnits } from './responsible-unit.extractor';
import { extractSections } from './section.extractor';

/** Run all deterministic extractors. Same text → same payload. */
export function runDeterministicExtraction(text: string): {
  payload: KnowledgeExtractionPayload;
  extractionCount: number;
} {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const payload: KnowledgeExtractionPayload = {
    metadata: extractMetadata(normalized),
    referencedDocuments: extractReferencedDocuments(normalized),
    departments: extractDepartments(normalized),
    responsibleUnits: extractResponsibleUnits(normalized),
    actionStatements: extractActionStatements(normalized),
    deadlines: extractDeadlines(normalized),
    priorityIndicators: extractPriorityIndicators(normalized),
    appendices: extractAppendices(normalized),
    sections: extractSections(normalized),
    logicalTables: extractLogicalTables(normalized),
    headings: extractHeadings(normalized),
  };
  return { payload, extractionCount: countExtractionItems(payload) };
}
