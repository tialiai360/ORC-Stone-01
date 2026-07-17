import { InMemoryExtractionRepository } from './in-memory-extraction.repository';

describe('InMemoryExtractionRepository', () => {
  it('saves and finds by id/document', async () => {
    const repo = new InMemoryExtractionRepository();
    const saved = await repo.save({
      id: '11111111-1111-1111-1111-111111111111',
      documentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      extractionVersion: '1.0.0',
      ruleVersion: '1.0.0',
      createdAt: '2026-01-01T00:00:00.000Z',
      extractionCount: 1,
      payload: {
        metadata: {
          documentNumber: '1',
          documentDate: null,
          documentTitle: null,
          issuer: null,
          documentType: null,
          effectiveDate: null,
        },
        referencedDocuments: [],
        departments: [],
        responsibleUnits: [],
        actionStatements: [],
        deadlines: [],
        priorityIndicators: [],
        appendices: [],
        sections: [],
        logicalTables: [],
        headings: [],
      },
    });
    expect(await repo.findById(saved.id)).not.toBeNull();
    expect(await repo.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
    expect(await repo.findByDocumentId(saved.documentId)).toHaveLength(1);
    repo.clear();
    expect(await repo.findByDocumentId(saved.documentId)).toHaveLength(0);
  });
});
