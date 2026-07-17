import { DocumentMetadata } from '@orc/shared';
import { DocumentEntity } from '../entity/document.entity';

export function toDocumentMetadata(entity: DocumentEntity): DocumentMetadata {
  return {
    id: entity.id,
    originalFilename: entity.originalFilename,
    contentType: entity.contentType,
    sizeBytes: Number(entity.sizeBytes),
    extension: entity.extension as DocumentMetadata['extension'],
    storagePath: entity.storagePath,
    uploadedAt: entity.uploadedAt.toISOString(),
  };
}

export interface DocumentRecordInput {
  id: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  extension: string;
  storagePath: string;
  uploadedAt: Date;
}

export interface DocumentRepository {
  save(input: DocumentRecordInput): Promise<DocumentMetadata>;
  findAll(): Promise<DocumentMetadata[]>;
  findById(id: string): Promise<DocumentMetadata | null>;
  deleteById(id: string): Promise<DocumentMetadata | null>;
}
