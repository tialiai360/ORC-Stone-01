import request from 'supertest';
import { createDocumentImportHarness } from '../src/modules/document-import/testing/document-import.harness';
import { MAX_DOCUMENT_SIZE_BYTES } from '@orc/shared';
import { readFile } from 'node:fs/promises';

describe('Document Import integration (MVI-003)', () => {
  let harness: Awaited<ReturnType<typeof createDocumentImportHarness>>;

  beforeEach(async () => {
    harness = await createDocumentImportHarness();
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  it('uploads, reads, and deletes a document', async () => {
    const upload = await request(harness.app.getHttpServer())
      .post('/documents')
      .set('x-uploader-session', 'int-session-1')
      .attach('file', Buffer.from('%PDF-1.4 int'), 'notice.pdf')
      .expect(201);

    expect(upload.body.id).toBeDefined();
    expect(upload.body.originalFilename).toBe('notice.pdf');
    expect(await harness.storage.exists(upload.body.storagePath)).toBe(true);

    const listed = await request(harness.app.getHttpServer()).get('/documents').expect(200);
    expect(listed.body.total).toBe(1);

    const one = await request(harness.app.getHttpServer())
      .get(`/documents/${upload.body.id}`)
      .expect(200);
    expect(one.body.id).toBe(upload.body.id);

    const evidence = await harness.evidence.findByDocumentId(upload.body.id);
    expect(evidence).toHaveLength(1);
    expect(evidence[0].type).toBe('DocumentImported');
    if (evidence[0].type === 'DocumentImported') {
      expect(evidence[0].uploaderSession).toBe('int-session-1');
    }

    await request(harness.app.getHttpServer())
      .delete(`/documents/${upload.body.id}`)
      .expect(200);
    expect(await harness.storage.exists(upload.body.storagePath)).toBe(false);
  });

  it('allows duplicate filename with distinct ids', async () => {
    const first = await request(harness.app.getHttpServer())
      .post('/documents')
      .attach('file', Buffer.from('%PDF-A'), 'same.pdf')
      .expect(201);
    const second = await request(harness.app.getHttpServer())
      .post('/documents')
      .attach('file', Buffer.from('%PDF-B'), 'same.pdf')
      .expect(201);

    expect(first.body.id).not.toBe(second.body.id);
    expect(first.body.storagePath).not.toBe(second.body.storagePath);
    const list = await request(harness.app.getHttpServer()).get('/documents').expect(200);
    expect(list.body.total).toBe(2);
  });

  it('rejects wrong extension', async () => {
    await request(harness.app.getHttpServer())
      .post('/documents')
      .attach('file', Buffer.from('hello'), 'notes.txt')
      .expect(400);
  });

  it('rejects large files', async () => {
    const huge = Buffer.alloc(MAX_DOCUMENT_SIZE_BYTES + 1, 1);
    await request(harness.app.getHttpServer())
      .post('/documents')
      .attach('file', huge, 'huge.pdf')
      .expect(413);
  });

  it('keeps storage consistent with metadata', async () => {
    const upload = await request(harness.app.getHttpServer())
      .post('/documents')
      .attach('file', Buffer.from('%PDF-consistent'), 'c.pdf')
      .expect(201);

    const abs = harness.storage.absolutePath(upload.body.storagePath);
    const bytes = await readFile(abs);
    expect(bytes.equals(Buffer.from('%PDF-consistent'))).toBe(true);
    expect(upload.body.sizeBytes).toBe(bytes.byteLength);
  });
});
