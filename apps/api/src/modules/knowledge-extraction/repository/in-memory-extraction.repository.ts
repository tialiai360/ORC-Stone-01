import { KnowledgeExtractionPayload, KnowledgeExtractionResult } from '@orc/shared';
import { ExtractionRecord, ExtractionRepository } from './extraction.repository';

export class InMemoryExtractionRepository implements ExtractionRepository {
  private readonly store = new Map<string, ExtractionRecord>();

  async save(record: ExtractionRecord): Promise<ExtractionRecord> {
    const copy: ExtractionRecord = JSON.parse(JSON.stringify(record)) as ExtractionRecord;
    this.store.set(copy.id, copy);
    return copy;
  }

  async findById(id: string): Promise<ExtractionRecord | null> {
    return this.store.get(id) ?? null;
  }

  async findByDocumentId(documentId: string): Promise<ExtractionRecord[]> {
    return [...this.store.values()]
      .filter((row) => row.documentId === documentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  clear(): void {
    this.store.clear();
  }
}

export function toResult(
  id: string,
  documentId: string,
  extractionVersion: string,
  ruleVersion: string,
  createdAt: Date,
  payload: KnowledgeExtractionPayload,
  extractionCount: number,
): KnowledgeExtractionResult {
  return {
    id,
    documentId,
    extractionVersion,
    ruleVersion,
    createdAt: createdAt.toISOString(),
    payload,
    extractionCount,
  };
}
