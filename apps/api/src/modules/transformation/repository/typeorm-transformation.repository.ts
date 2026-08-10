import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BranchTransformationModel,
  TransformationResult,
} from '@orc/shared';
import { TransformationEntity } from '../entity/transformation.entity';
import {
  TransformationRecord,
  TransformationRepository,
} from './transformation.repository';

@Injectable()
export class TypeOrmTransformationRepository implements TransformationRepository {
  constructor(
    @InjectRepository(TransformationEntity)
    private readonly repo: Repository<TransformationEntity>,
  ) {}

  async save(record: TransformationRecord): Promise<TransformationRecord> {
    const entity = this.repo.create({
      id: record.id,
      extractionId: record.extractionId,
      documentId: record.documentId,
      transformVersion: record.transformVersion,
      ruleVersion: record.ruleVersion,
      fieldCount: record.fieldCount,
      model: JSON.stringify(record.model),
      createdAt: new Date(record.createdAt),
    });
    const saved = await this.repo.save(entity);
    return this.toRecord(saved);
  }

  async findById(id: string): Promise<TransformationRecord | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async findByExtractionId(extractionId: string): Promise<TransformationRecord[]> {
    const rows = await this.repo.find({
      where: { extractionId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toRecord(row));
  }

  private toRecord(entity: TransformationEntity): TransformationResult {
    return {
      id: entity.id,
      extractionId: entity.extractionId,
      documentId: entity.documentId,
      transformVersion: entity.transformVersion,
      ruleVersion: entity.ruleVersion,
      createdAt: entity.createdAt.toISOString(),
      model: JSON.parse(entity.model) as BranchTransformationModel,
      fieldCount: entity.fieldCount,
    };
  }
}
