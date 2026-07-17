import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DocumentImportedEvidence,
  EvidenceRecord,
  KnowledgeExtractedEvidence,
} from '@orc/shared';
import { EvidenceRepository } from './repository/evidence.repository';

export const EVIDENCE_REPOSITORY = Symbol('EVIDENCE_REPOSITORY');

@Injectable()
export class EvidenceService {
  constructor(private readonly evidenceRepository: EvidenceRepository) {}

  async recordDocumentImported(input: {
    documentId: string;
    filename: string;
    contentType: string;
    fileSize: number;
    uploaderSession: string;
    timestamp?: Date;
  }): Promise<EvidenceRecord> {
    const timestamp = (input.timestamp ?? new Date()).toISOString();
    const payload: DocumentImportedEvidence & { id: string } = {
      id: randomUUID(),
      type: 'DocumentImported',
      documentId: input.documentId,
      filename: input.filename,
      contentType: input.contentType,
      timestamp,
      fileSize: input.fileSize,
      uploaderSession: input.uploaderSession,
    };
    return this.evidenceRepository.append(payload);
  }

  async recordKnowledgeExtracted(input: {
    extractionId: string;
    documentId: string;
    extractionVersion: string;
    ruleVersion: string;
    extractionDurationMs: number;
    extractionCount: number;
    timestamp?: Date;
  }): Promise<EvidenceRecord> {
    const timestamp = (input.timestamp ?? new Date()).toISOString();
    const payload: KnowledgeExtractedEvidence & { id: string } = {
      id: randomUUID(),
      type: 'KnowledgeExtracted',
      extractionId: input.extractionId,
      documentId: input.documentId,
      timestamp,
      extractionVersion: input.extractionVersion,
      ruleVersion: input.ruleVersion,
      extractionDurationMs: input.extractionDurationMs,
      extractionCount: input.extractionCount,
    };
    return this.evidenceRepository.append(payload);
  }

  listByDocument(documentId: string): Promise<EvidenceRecord[]> {
    return this.evidenceRepository.findByDocumentId(documentId);
  }
}
