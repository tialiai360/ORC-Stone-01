import { InMemoryTransformationRepository } from './in-memory-transformation.repository';

describe('InMemoryTransformationRepository', () => {
  it('saves and finds by id/extraction', async () => {
    const repo = new InMemoryTransformationRepository();
    const saved = await repo.save({
      id: '11111111-1111-1111-1111-111111111111',
      extractionId: '22222222-2222-2222-2222-222222222222',
      documentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      transformVersion: '1.0.0',
      ruleVersion: '1.0.0',
      createdAt: '2026-01-01T00:00:00.000Z',
      fieldCount: 1,
      model: {
        intent: {
          value: 'x',
          trace: {
            sourceDocumentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            section: null,
            paragraph: null,
            evidenceReference: 'ke:payload.metadata.documentTitle',
            ruleVersion: '1.0.0',
          },
        },
        actions: [],
        responsibleUnits: [],
        targetAudience: [],
        priority: {
          value: null,
          trace: {
            sourceDocumentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            section: null,
            paragraph: null,
            evidenceReference: 'ke:payload.priorityIndicators',
            ruleVersion: '1.0.0',
          },
        },
        deadlines: [],
        requiredDeliverables: [],
        references: [],
        attachments: [],
        businessContext: {
          documentNumber: {
            value: null,
            trace: {
              sourceDocumentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              section: null,
              paragraph: null,
              evidenceReference: 'ke:payload.metadata.documentNumber',
              ruleVersion: '1.0.0',
            },
          },
          documentTitle: {
            value: 'x',
            trace: {
              sourceDocumentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              section: null,
              paragraph: null,
              evidenceReference: 'ke:payload.metadata.documentTitle',
              ruleVersion: '1.0.0',
            },
          },
          documentType: {
            value: null,
            trace: {
              sourceDocumentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              section: null,
              paragraph: null,
              evidenceReference: 'ke:payload.metadata.documentType',
              ruleVersion: '1.0.0',
            },
          },
          issuer: {
            value: null,
            trace: {
              sourceDocumentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              section: null,
              paragraph: null,
              evidenceReference: 'ke:payload.metadata.issuer',
              ruleVersion: '1.0.0',
            },
          },
          documentDate: {
            value: null,
            trace: {
              sourceDocumentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              section: null,
              paragraph: null,
              evidenceReference: 'ke:payload.metadata.documentDate',
              ruleVersion: '1.0.0',
            },
          },
          effectiveDate: {
            value: null,
            trace: {
              sourceDocumentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              section: null,
              paragraph: null,
              evidenceReference: 'ke:payload.metadata.effectiveDate',
              ruleVersion: '1.0.0',
            },
          },
        },
      },
    });
    expect(await repo.findById(saved.id)).not.toBeNull();
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
    expect(await repo.findByExtractionId(saved.extractionId)).toHaveLength(1);
    repo.clear();
  });
});
