import { NotFoundException } from '@nestjs/common';
import {
  EXTRACTION_VERSION,
  KnowledgeExtractionResult,
  RULE_VERSION,
} from '@orc/shared';
import { EvidenceService } from '../evidence/evidence.service';
import { InMemoryEvidenceRepository } from '../evidence/repository/in-memory-evidence.repository';
import { KnowledgeExtractionService } from '../knowledge-extraction/knowledge-extraction.service';
import { InMemoryTransformationRepository } from './repository/in-memory-transformation.repository';
import { TransformationService } from './transformation.service';

function sampleExtraction(): KnowledgeExtractionResult {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    documentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    extractionVersion: EXTRACTION_VERSION,
    ruleVersion: RULE_VERSION,
    createdAt: '2026-01-01T00:00:00.000Z',
    extractionCount: 3,
    payload: {
      metadata: {
        documentNumber: '01/TB',
        documentDate: null,
        documentTitle: 'Title',
        issuer: null,
        documentType: null,
        effectiveDate: null,
      },
      referencedDocuments: [],
      departments: [],
      responsibleUnits: ['Unit A'],
      actionStatements: [],
      deadlines: [],
      priorityIndicators: [],
      appendices: [],
      sections: [],
      logicalTables: [],
      headings: [],
    },
  };
}

describe('TransformationService', () => {
  it('transforms, persists, emits TransformationCompleted evidence', async () => {
    const extraction = sampleExtraction();
    const extractions = {
      getById: jest.fn().mockResolvedValue(extraction),
    };
    const evidenceRepo = new InMemoryEvidenceRepository();
    const evidence = new EvidenceService(evidenceRepo);
    const repo = new InMemoryTransformationRepository();
    const service = new TransformationService(
      extractions as unknown as KnowledgeExtractionService,
      repo,
      evidence,
    );

    const first = await service.transformExtraction(extraction.id);
    const second = await service.transformExtraction(extraction.id);
    expect(first.model).toEqual(second.model);
    expect(first.id).not.toBe(second.id);
    expect(first.model.intent.value).toBe('Title');

    const evidenceRows = await evidenceRepo.findByDocumentId(extraction.documentId);
    const completed = evidenceRows.filter((e) => e.type === 'TransformationCompleted');
    expect(completed).toHaveLength(2);
    if (completed[0].type === 'TransformationCompleted') {
      expect(completed[0].transformationId).toBe(first.id);
      expect(completed[0].extractionId).toBe(extraction.id);
      expect(completed[0].documentId).toBe(extraction.documentId);
      expect(completed[0].ruleVersion).toBe('1.0.0');
      expect(completed[0].durationMs).toBeGreaterThanOrEqual(0);
      expect(completed[0].sourceTraceCount).toBeGreaterThan(0);
      expect(completed[0].timestamp).toBeTruthy();
    }

    expect(await service.getById(first.id)).toEqual(first);
    const listed = await service.listByExtraction(extraction.id);
    expect(listed.total).toBe(2);
  });

  it('throws when transformation missing', async () => {
    const service = new TransformationService(
      { getById: jest.fn() } as unknown as KnowledgeExtractionService,
      new InMemoryTransformationRepository(),
      new EvidenceService(new InMemoryEvidenceRepository()),
    );
    await expect(
      service.getById('11111111-1111-1111-1111-111111111111'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
