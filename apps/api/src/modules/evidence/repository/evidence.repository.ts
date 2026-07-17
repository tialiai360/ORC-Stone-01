import { EvidenceRecord } from '@orc/shared';

export interface EvidenceRepository {
  append(record: EvidenceRecord): Promise<EvidenceRecord>;
  findByDocumentId(documentId: string): Promise<EvidenceRecord[]>;
  findAll(): Promise<EvidenceRecord[]>;
}
