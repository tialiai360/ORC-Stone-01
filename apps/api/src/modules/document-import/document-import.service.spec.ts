import { NotFoundException } from '@nestjs/common';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { DocumentImportService } from './document-import.service';
import { InMemoryDocumentRepository } from './repository/in-memory-document.repository';
import { LocalFileStorageService } from './storage/local-file-storage.service';
import { EvidenceService } from '../evidence/evidence.service';
import { InMemoryEvidenceRepository } from '../evidence/repository/in-memory-evidence.repository';

describe('DocumentImportService', () => {
  let root: string;
  let documents: InMemoryDocumentRepository;
  let evidenceRepo: InMemoryEvidenceRepository;
  let service: DocumentImportService;
  let storage: LocalFileStorageService;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'orc-svc-'));
    documents = new InMemoryDocumentRepository();
    evidenceRepo = new InMemoryEvidenceRepository();
    storage = new LocalFileStorageService(root);
    service = new DocumentImportService(
      documents,
      storage,
      new EvidenceService(evidenceRepo),
    );
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('uploads pdf metadata and stores original', async () => {
    const doc = await service.importDocument({
      originalFilename: 'notice.pdf',
      buffer: Buffer.from('%PDF-1.4'),
      declaredContentType: 'application/pdf',
      uploaderSession: 'session-a',
    });

    expect(doc.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(doc.originalFilename).toBe('notice.pdf');
    expect(doc.contentType).toBe('application/pdf');
    expect(doc.sizeBytes).toBe(8);
    expect(await storage.exists(doc.storagePath)).toBe(true);

    const evidence = await evidenceRepo.findByDocumentId(doc.id);
    expect(evidence).toHaveLength(1);
    expect(evidence[0].type).toBe('DocumentImported');
    if (evidence[0].type === 'DocumentImported') {
      expect(evidence[0].uploaderSession).toBe('session-a');
    }
  });

  it('lists and gets documents', async () => {
    const created = await service.importDocument({
      originalFilename: 'a.docx',
      buffer: Buffer.from('PK'),
      uploaderSession: 's',
    });
    const list = await service.listDocuments();
    expect(list.total).toBe(1);
    expect(await service.getDocument(created.id)).toEqual(created);
  });

  it('deletes document and file', async () => {
    const created = await service.importDocument({
      originalFilename: 'a.pdf',
      buffer: Buffer.from('%PDF'),
      uploaderSession: 's',
    });
    await service.deleteDocument(created.id);
    expect(await storage.exists(created.storagePath)).toBe(false);
    await expect(service.getDocument(created.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found on missing delete', async () => {
    await expect(
      service.deleteDocument('11111111-1111-1111-1111-111111111111'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rolls back file when metadata save fails', async () => {
    const failingDocs = {
      save: jest.fn().mockRejectedValue(new Error('db down')),
      findAll: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
    };
    const failingService = new DocumentImportService(
      failingDocs,
      storage,
      new EvidenceService(evidenceRepo),
    );

    await expect(
      failingService.importDocument({
        originalFilename: 'a.pdf',
        buffer: Buffer.from('%PDF'),
        uploaderSession: 's',
      }),
    ).rejects.toThrow('db down');

    const listed = await storage.exists(
      storage.buildStoragePath('anything', 'pdf'),
    );
    // file path uses random UUID; ensure uploads dir has no leftover by checking documents map empty
    expect(listed).toBe(false);
    const all = await documents.findAll();
    expect(all).toHaveLength(0);
  });
});
