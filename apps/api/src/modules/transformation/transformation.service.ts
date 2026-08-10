import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  countSourceTraces,
  TRANSFORMATION_VERSION,
  TRANSFORM_RULE_VERSION,
  TransformationResult,
} from '@orc/shared';
import { EvidenceService } from '../evidence/evidence.service';
import { KnowledgeExtractionService } from '../knowledge-extraction/knowledge-extraction.service';
import { mapExtractionToBranchModel } from './mapper/pipeline.mapper';
import { TransformationRepository } from './repository/transformation.repository';
import { assertValidExtractionForTransform } from './validation/transformation.validation';

export const TRANSFORMATION_REPOSITORY = Symbol('TRANSFORMATION_REPOSITORY');

@Injectable()
export class TransformationService {
  constructor(
    private readonly extractions: KnowledgeExtractionService,
    @Inject(TRANSFORMATION_REPOSITORY)
    private readonly transformations: TransformationRepository,
    private readonly evidence: EvidenceService,
  ) {}

  async transformExtraction(extractionId: string): Promise<TransformationResult> {
    const started = Date.now();
    const extraction = await this.extractions.getById(extractionId);
    assertValidExtractionForTransform(extraction);

    const { model, fieldCount } = mapExtractionToBranchModel(extraction);
    const createdAt = new Date();
    const result: TransformationResult = {
      id: randomUUID(),
      extractionId: extraction.id,
      documentId: extraction.documentId,
      transformVersion: TRANSFORMATION_VERSION,
      ruleVersion: TRANSFORM_RULE_VERSION,
      createdAt: createdAt.toISOString(),
      model,
      fieldCount,
    };

    const saved = await this.transformations.save(result);
    await this.evidence.recordTransformationCompleted({
      transformationId: saved.id,
      extractionId: saved.extractionId,
      documentId: saved.documentId,
      ruleVersion: saved.ruleVersion,
      durationMs: Math.max(0, Date.now() - started),
      sourceTraceCount: countSourceTraces(saved.model),
      timestamp: createdAt,
    });
    return saved;
  }

  async getById(id: string): Promise<TransformationResult> {
    const row = await this.transformations.findById(id);
    if (!row) {
      throw new NotFoundException(`Transformation ${id} not found.`);
    }
    return row;
  }

  async listByExtraction(extractionId: string): Promise<{
    items: TransformationResult[];
    total: number;
  }> {
    await this.extractions.getById(extractionId);
    const items = await this.transformations.findByExtractionId(extractionId);
    return { items, total: items.length };
  }
}
