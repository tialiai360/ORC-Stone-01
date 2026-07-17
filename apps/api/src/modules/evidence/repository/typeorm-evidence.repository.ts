import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenceRecord } from '@orc/shared';
import { EvidenceEntity } from '../entity/evidence.entity';
import { EvidenceRepository } from './evidence.repository';

@Injectable()
export class TypeOrmEvidenceRepository implements EvidenceRepository {
  constructor(
    @InjectRepository(EvidenceEntity)
    private readonly repo: Repository<EvidenceEntity>,
  ) {}

  async append(record: EvidenceRecord): Promise<EvidenceRecord> {
    const { id, type, documentId, timestamp, ...rest } = record;
    const entity = this.repo.create({
      id,
      type,
      documentId,
      payload: JSON.stringify(rest),
      timestamp: new Date(timestamp),
    });
    await this.repo.save(entity);
    return record;
  }

  async findByDocumentId(documentId: string): Promise<EvidenceRecord[]> {
    const rows = await this.repo.find({
      where: { documentId },
      order: { timestamp: 'ASC' },
    });
    return rows.map((row) => this.toRecord(row));
  }

  async findAll(): Promise<EvidenceRecord[]> {
    const rows = await this.repo.find({ order: { timestamp: 'DESC' } });
    return rows.map((row) => this.toRecord(row));
  }

  private toRecord(entity: EvidenceEntity): EvidenceRecord {
    const rest = JSON.parse(entity.payload) as Record<string, unknown>;
    return {
      id: entity.id,
      type: entity.type,
      documentId: entity.documentId,
      timestamp: entity.timestamp.toISOString(),
      ...rest,
    } as EvidenceRecord;
  }
}
