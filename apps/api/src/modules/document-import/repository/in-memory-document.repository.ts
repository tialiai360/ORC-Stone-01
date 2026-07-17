import { DocumentMetadata } from '@orc/shared';
import {
  DocumentRecordInput,
  DocumentRepository,
} from './document.repository';

/** In-memory repository for unit tests / offline bootstrap. */
export class InMemoryDocumentRepository implements DocumentRepository {
  private readonly store = new Map<string, DocumentRecordInput>();

  async save(input: DocumentRecordInput): Promise<DocumentMetadata> {
    this.store.set(input.id, { ...input });
    return this.toMeta(input);
  }

  async findAll(): Promise<DocumentMetadata[]> {
    return [...this.store.values()]
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .map((row) => this.toMeta(row));
  }

  async findById(id: string): Promise<DocumentMetadata | null> {
    const row = this.store.get(id);
    return row ? this.toMeta(row) : null;
  }

  async deleteById(id: string): Promise<DocumentMetadata | null> {
    const row = this.store.get(id);
    if (!row) {
      return null;
    }
    this.store.delete(id);
    return this.toMeta(row);
  }

  clear(): void {
    this.store.clear();
  }

  private toMeta(input: DocumentRecordInput): DocumentMetadata {
    return {
      id: input.id,
      originalFilename: input.originalFilename,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      extension: input.extension as DocumentMetadata['extension'],
      storagePath: input.storagePath,
      uploadedAt: input.uploadedAt.toISOString(),
    };
  }
}
