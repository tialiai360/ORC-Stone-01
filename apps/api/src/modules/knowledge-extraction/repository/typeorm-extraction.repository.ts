import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  KnowledgeExtractionPayload,
  KnowledgeExtractionResult,
} from '@orc/shared';
import { ExtractionEntity } from '../entity/extraction.entity';
import { ExtractionRecord, ExtractionRepository } from './extraction.repository';

@Injectable()
export class TypeOrmExtractionRepository implements ExtractionRepository {
  constructor(
    @InjectRepository(ExtractionEntity)
    private readonly repo: Repository<ExtractionEntity>,
  ) {}

  async save(record: ExtractionRecord): Promise<ExtractionRecord> {
    const entity = this.repo.create({
      id: record.id,
      documentId: record.documentId,
      extractionVersion: record.extractionVersion,
      ruleVersion: record.ruleVersion,
      extractionCount: record.extractionCount,
      payload: JSON.stringify(record.payload),
      createdAt: new Date(record.createdAt),
    });
    const saved = await this.repo.save(entity);
    return this.toRecord(saved);
  }

  async findById(id: string): Promise<ExtractionRecord | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async findByDocumentId(documentId: string): Promise<ExtractionRecord[]> {
    const rows = await this.repo.find({
      where: { documentId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toRecord(row));
  }

  private toRecord(entity: ExtractionEntity): KnowledgeExtractionResult {
    return {
      id: entity.id,
      documentId: entity.documentId,
      extractionVersion: entity.extractionVersion,
      ruleVersion: entity.ruleVersion,
      createdAt: entity.createdAt.toISOString(),
      payload: JSON.parse(entity.payload) as KnowledgeExtractionPayload,
      extractionCount: entity.extractionCount,
    };
  }
}
