import { TransformationResult } from '@orc/shared';

export type TransformationRecord = TransformationResult;

export interface TransformationRepository {
  save(record: TransformationRecord): Promise<TransformationRecord>;
  findById(id: string): Promise<TransformationRecord | null>;
  findByExtractionId(extractionId: string): Promise<TransformationRecord[]>;
}
