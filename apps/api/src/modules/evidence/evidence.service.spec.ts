import { EvidenceService } from './evidence.service';
import { InMemoryEvidenceRepository } from './repository/in-memory-evidence.repository';

describe('EvidenceService', () => {
  it('records DocumentImported evidence without observation/knowledge', async () => {
    const repo = new InMemoryEvidenceRepository();
    const service = new EvidenceService(repo);
    const record = await service.recordDocumentImported({
      documentId: '11111111-1111-1111-1111-111111111111',
      filename: 'a.pdf',
      contentType: 'application/pdf',
      fileSize: 12,
      uploaderSession: 'sess-1',
    });

    expect(record.type).toBe('DocumentImported');
    if (record.type === 'DocumentImported') {
      expect(record.filename).toBe('a.pdf');
      expect(record.fileSize).toBe(12);
      expect(record.uploaderSession).toBe('sess-1');
    }

    const listed = await service.listByDocument(record.documentId);
    expect(listed).toHaveLength(1);
    expect(await repo.findAll()).toHaveLength(1);
  });

  it('records KnowledgeExtracted evidence', async () => {
    const repo = new InMemoryEvidenceRepository();
    const service = new EvidenceService(repo);
    const record = await service.recordKnowledgeExtracted({
      extractionId: '22222222-2222-2222-2222-222222222222',
      documentId: '11111111-1111-1111-1111-111111111111',
      extractionVersion: '1.0.0',
      ruleVersion: '1.0.0',
      extractionDurationMs: 12,
      extractionCount: 7,
    });
    expect(record.type).toBe('KnowledgeExtracted');
    if (record.type === 'KnowledgeExtracted') {
      expect(record.extractionCount).toBe(7);
      expect(record.ruleVersion).toBe('1.0.0');
    }
  });
});
