import { InMemoryEvidenceRepository } from './in-memory-evidence.repository';

describe('InMemoryEvidenceRepository', () => {
  it('appends, lists by document, and lists all sorted', async () => {
    const repo = new InMemoryEvidenceRepository();
    const older = await repo.append({
      id: '11111111-1111-1111-1111-111111111111',
      type: 'DocumentImported',
      documentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      filename: 'a.pdf',
      contentType: 'application/pdf',
      timestamp: '2026-01-01T00:00:00.000Z',
      fileSize: 1,
      uploaderSession: 's1',
    });
    await repo.append({
      id: '22222222-2222-2222-2222-222222222222',
      type: 'KnowledgeExtracted',
      documentId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      extractionId: '33333333-3333-3333-3333-333333333333',
      timestamp: '2026-02-01T00:00:00.000Z',
      extractionVersion: '1.0.0',
      ruleVersion: '1.0.0',
      extractionDurationMs: 5,
      extractionCount: 2,
    });

    expect(await repo.findByDocumentId(older.documentId)).toHaveLength(1);
    const all = await repo.findAll();
    expect(all[0].type).toBe('KnowledgeExtracted');
    repo.clear();
    expect(await repo.findAll()).toHaveLength(0);
  });
});
