import { KnowledgeExtractionResult } from '@orc/shared';

export type ExtractionRecord = KnowledgeExtractionResult;

export interface ExtractionRepository {
  save(record: ExtractionRecord): Promise<ExtractionRecord>;
  findById(id: string): Promise<ExtractionRecord | null>;
  findByDocumentId(documentId: string): Promise<ExtractionRecord[]>;
}
