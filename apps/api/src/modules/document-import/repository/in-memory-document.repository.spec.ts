import { InMemoryDocumentRepository } from './in-memory-document.repository';

describe('InMemoryDocumentRepository', () => {
  it('saves, lists, finds, and deletes', async () => {
    const repo = new InMemoryDocumentRepository();
    const older = await repo.save({
      id: '11111111-1111-1111-1111-111111111111',
      originalFilename: 'a.pdf',
      contentType: 'application/pdf',
      sizeBytes: 3,
      extension: 'pdf',
      storagePath: 'uploads/documents/a.pdf',
      uploadedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = await repo.save({
      id: '22222222-2222-2222-2222-222222222222',
      originalFilename: 'b.pdf',
      contentType: 'application/pdf',
      sizeBytes: 4,
      extension: 'pdf',
      storagePath: 'uploads/documents/b.pdf',
      uploadedAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    expect(older.originalFilename).toBe('a.pdf');
    const all = await repo.findAll();
    expect(all[0].id).toBe(newer.id);
    expect(await repo.findById(older.id)).not.toBeNull();
    expect(await repo.findById('33333333-3333-3333-3333-333333333333')).toBeNull();
    expect(await repo.deleteById(older.id)).not.toBeNull();
    expect(await repo.deleteById(older.id)).toBeNull();
    repo.clear();
    expect(await repo.findAll()).toHaveLength(0);
  });
});
