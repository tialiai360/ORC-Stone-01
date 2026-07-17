import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentMetadata } from '@orc/shared';
import { DocumentEntity } from '../entity/document.entity';
import {
  DocumentRecordInput,
  DocumentRepository,
  toDocumentMetadata,
} from './document.repository';

@Injectable()
export class TypeOrmDocumentRepository implements DocumentRepository {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly repo: Repository<DocumentEntity>,
  ) {}

  async save(input: DocumentRecordInput): Promise<DocumentMetadata> {
    const entity = this.repo.create({
      id: input.id,
      originalFilename: input.originalFilename,
      contentType: input.contentType,
      sizeBytes: String(input.sizeBytes),
      extension: input.extension,
      storagePath: input.storagePath,
      uploadedAt: input.uploadedAt,
    });
    const saved = await this.repo.save(entity);
    return toDocumentMetadata(saved);
  }

  async findAll(): Promise<DocumentMetadata[]> {
    const rows = await this.repo.find({ order: { uploadedAt: 'DESC' } });
    return rows.map(toDocumentMetadata);
  }

  async findById(id: string): Promise<DocumentMetadata | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? toDocumentMetadata(row) : null;
  }

  async deleteById(id: string): Promise<DocumentMetadata | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    await this.repo.delete({ id });
    return existing;
  }
}
