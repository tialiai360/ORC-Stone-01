import { EvidenceRecord } from '@orc/shared';
import { EvidenceRepository } from './evidence.repository';

export class InMemoryEvidenceRepository implements EvidenceRepository {
  private readonly store: EvidenceRecord[] = [];

  async append(record: EvidenceRecord): Promise<EvidenceRecord> {
    this.store.push({ ...record });
    return record;
  }

  async findByDocumentId(documentId: string): Promise<EvidenceRecord[]> {
    return this.store.filter((row) => row.documentId === documentId);
  }

  async findAll(): Promise<EvidenceRecord[]> {
    return [...this.store].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  clear(): void {
    this.store.length = 0;
  }
}
