import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DocumentListResponse, DocumentMetadata } from '@orc/shared';
import { EvidenceService } from '../evidence/evidence.service';
import { DocumentRepository } from './repository/document.repository';
import { LocalFileStorageService } from './storage/local-file-storage.service';
import { validateUploadBuffer } from './validation/document-upload.validation';

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

export interface ImportDocumentInput {
  originalFilename: string;
  buffer: Buffer;
  declaredContentType?: string;
  uploaderSession: string;
}

@Injectable()
export class DocumentImportService {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documents: DocumentRepository,
    private readonly storage: LocalFileStorageService,
    private readonly evidence: EvidenceService,
  ) {}

  async importDocument(input: ImportDocumentInput): Promise<DocumentMetadata> {
    const validated = validateUploadBuffer(
      input.originalFilename,
      input.buffer.byteLength,
      input.declaredContentType,
    );

    const id = randomUUID();
    const uploadedAt = new Date();
    const storagePath = this.storage.buildStoragePath(id, validated.extension);

    await this.storage.saveOriginal(storagePath, input.buffer);

    try {
      const metadata = await this.documents.save({
        id,
        originalFilename: validated.originalFilename,
        contentType: validated.contentType,
        sizeBytes: validated.sizeBytes,
        extension: validated.extension,
        storagePath,
        uploadedAt,
      });

      await this.evidence.recordDocumentImported({
        documentId: metadata.id,
        filename: metadata.originalFilename,
        contentType: metadata.contentType,
        fileSize: metadata.sizeBytes,
        uploaderSession: input.uploaderSession,
        timestamp: uploadedAt,
      });

      return metadata;
    } catch (error) {
      await this.storage.deleteOriginal(storagePath);
      throw error;
    }
  }

  async listDocuments(): Promise<DocumentListResponse> {
    const items = await this.documents.findAll();
    return { items, total: items.length };
  }

  async getDocument(id: string): Promise<DocumentMetadata> {
    const doc = await this.documents.findById(id);
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found.`);
    }
    return doc;
  }

  async deleteDocument(id: string): Promise<{ id: string; deleted: true }> {
    const existing = await this.documents.deleteById(id);
    if (!existing) {
      throw new NotFoundException(`Document ${id} not found.`);
    }
    await this.storage.deleteOriginal(existing.storagePath);
    return { id, deleted: true };
  }
}
