import { TransformationRecord, TransformationRepository } from './transformation.repository';

export class InMemoryTransformationRepository implements TransformationRepository {
  private readonly store = new Map<string, TransformationRecord>();

  async save(record: TransformationRecord): Promise<TransformationRecord> {
    const copy = JSON.parse(JSON.stringify(record)) as TransformationRecord;
    this.store.set(copy.id, copy);
    return copy;
  }

  async findById(id: string): Promise<TransformationRecord | null> {
    return this.store.get(id) ?? null;
  }

  async findByExtractionId(extractionId: string): Promise<TransformationRecord[]> {
    return [...this.store.values()]
      .filter((row) => row.extractionId === extractionId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  clear(): void {
    this.store.clear();
  }
}
